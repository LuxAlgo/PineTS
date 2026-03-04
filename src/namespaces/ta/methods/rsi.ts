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
                prevInitGains: [],
                prevInitLosses: [],
                // Tentative state
                currentPrevValue: null,
                currentAvgGain: 0,
                currentAvgLoss: 0,
                currentInitGains: [],
                currentInitLosses: [],
            };
        }

        const state = context.taState[stateKey];

        // Commit logic
        if (context.idx > state.lastIdx) {
            if (state.lastIdx >= 0) {
                state.prevPrevValue = state.currentPrevValue;
                state.prevAvgGain = state.currentAvgGain;
                state.prevAvgLoss = state.currentAvgLoss;
                state.prevInitGains = [...state.currentInitGains]; // Deep copy array
                state.prevInitLosses = [...state.currentInitLosses]; // Deep copy array
            }
            state.lastIdx = context.idx;
        }

        const currentValue = Series.from(source).get(0);

        // Skip NaN/null/undefined values — don't advance RSI state
        if (currentValue === null || currentValue === undefined || isNaN(currentValue)) {
            return NaN;
        }

        // Use committed state
        const prevValue = state.prevPrevValue;

        // First valid bar or previous was NaN/null — store value, don't compute diff
        if (prevValue === null || isNaN(prevValue)) {
            state.currentPrevValue = currentValue;
            state.currentInitGains = [...state.prevInitGains];
            state.currentInitLosses = [...state.prevInitLosses];
            state.currentAvgGain = state.prevAvgGain;
            state.currentAvgLoss = state.prevAvgLoss;
            return NaN;
        }

        let avgGain = state.prevAvgGain;
        let avgLoss = state.prevAvgLoss;
        const initGains = [...state.prevInitGains]; // Copy for tentative usage
        const initLosses = [...state.prevInitLosses]; // Copy for tentative usage

        // Calculate gain/loss from previous value
        const diff = currentValue - prevValue;
        const gain = diff > 0 ? diff : 0;
        const loss = diff < 0 ? -diff : 0;

        // Accumulate gains/losses until we have 'period' values
        if (initGains.length < period) {
            initGains.push(gain);
            initLosses.push(loss);

            // Update tentative state arrays
            state.currentInitGains = initGains;
            state.currentInitLosses = initLosses;
            state.currentPrevValue = currentValue;

            // Once we have 'period' gain/loss pairs, calculate first RSI
            if (initGains.length === period) {
                // Calculate first RSI using simple averages
                avgGain = initGains.reduce((a, b) => a + b, 0) / period;
                avgLoss = initLosses.reduce((a, b) => a + b, 0) / period;

                state.currentAvgGain = avgGain;
                state.currentAvgLoss = avgLoss;

                const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
                return context.precision(rsi);
            }
            return NaN;
        }

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
