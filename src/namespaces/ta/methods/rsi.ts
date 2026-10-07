// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function rsi(context: any) {
    return (source: any, _period: any, _callId?: string) => {
        const period = Series.from(_period).get(0);

        // Incremental RSI calculation
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `rsi_${period}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: -1,
                // Committed state
                prevPrevValue: null,
                prevAvgGain: 0,
                prevAvgLoss: 0,
                // First `period` gains / losses (the seed of the averages), committed
                initGains: [],
                initLosses: [],
                // Tentative state
                currentPrevValue: null,
                currentAvgGain: 0,
                currentAvgLoss: 0,
                // Gain / loss the current bar adds to the seed, if any
                currentInit: null,
            };
        }

        const state = context.taState[stateKey];

        // Commit logic
        if (context.idx > state.lastIdx) {
            if (state.lastIdx >= 0) {
                state.prevPrevValue = state.currentPrevValue;
                state.prevAvgGain = state.currentAvgGain;
                state.prevAvgLoss = state.currentAvgLoss;
                if (state.currentInit) {
                    state.initGains.push(state.currentInit[0]);
                    state.initLosses.push(state.currentInit[1]);
                }
            }
            state.currentInit = null;
            state.lastIdx = context.idx;
        }

        const currentValue = Series.from(source).get(0);

        // An na bar does not advance the averages, and the change on the next bar is na too (it
        // needs the value before it), so that bar returns na and only stores its value, as on TradingView.
        if (currentValue === null || currentValue === undefined || isNaN(currentValue)) {
            state.currentPrevValue = NaN;
            state.currentInit = null;
            state.currentAvgGain = state.prevAvgGain;
            state.currentAvgLoss = state.prevAvgLoss;
            return NaN;
        }

        // Use committed state
        const prevValue = state.prevPrevValue;

        // First valid bar or previous was NaN/null — store value, don't compute diff
        if (prevValue === null || isNaN(prevValue)) {
            state.currentPrevValue = currentValue;
            state.currentInit = null;
            state.currentAvgGain = state.prevAvgGain;
            state.currentAvgLoss = state.prevAvgLoss;
            return NaN;
        }

        let avgGain = state.prevAvgGain;
        let avgLoss = state.prevAvgLoss;

        // Calculate gain/loss from previous value
        const diff = currentValue - prevValue;
        const gain = diff > 0 ? diff : 0;
        const loss = diff < 0 ? -diff : 0;

        // Accumulate gains/losses until we have 'period' values
        if (state.initGains.length < period) {
            state.currentInit = [gain, loss];
            state.currentPrevValue = currentValue;

            // Once we have 'period' gain/loss pairs, calculate first RSI using simple averages
            if (state.initGains.length + 1 === period) {
                avgGain = (state.initGains.reduce((a: number, b: number) => a + b, 0) + gain) / period;
                avgLoss = (state.initLosses.reduce((a: number, b: number) => a + b, 0) + loss) / period;

                state.currentAvgGain = avgGain;
                state.currentAvgLoss = avgLoss;

                const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
                return context.precision(rsi);
            }
            return NaN;
        }
        state.currentInit = null;

        // Calculate RSI using smoothed averages (Wilder's smoothing)
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;

        // Store tentative state
        state.currentAvgGain = avgGain;
        state.currentAvgLoss = avgLoss;
        state.currentPrevValue = currentValue;

        const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
        return context.precision(rsi);
    };
}
