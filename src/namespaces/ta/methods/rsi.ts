// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Relative Strength Index (RSI)
 *
 * Formula:
 * - RSI = 100 - 100 / (1 + RS)
 * - RS = Average Gain / Average Loss
 *
 * @param source - Source series
 * @param period - Period of RSI
 * @returns RSI value
 */
export function rsi(context: any) {
    return (source: any, _period: any, _callId?: string) => {
        const period = Series.from(_period).get(0);
        if (period <= 0) return NaN;

        // Incremental RSI calculation
        if (!context.taState) context.taState = {};
        const stateKey = _callId ? `${_callId}_${period}` : `rsi_${period}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: context.idx - 1,
                // Committed state
                committedPrevValue: null,
                committedAvgGain: 0,
                committedAvgLoss: 0,
                committedInitGains: [],
                committedInitLosses: [],
                // Tentative state
                currentPrevValue: null,
                currentAvgGain: 0,
                currentAvgLoss: 0,
                currentInitGains: [],
                currentInitLosses: [],
                currentResult: NaN,
            };
        }

        const state = context.taState[stateKey];

        // Commit logic: lock previous tentative state
        if (context.idx > state.lastIdx) {
            state.committedPrevValue = state.currentPrevValue;
            state.committedAvgGain = state.currentAvgGain;
            state.committedAvgLoss = state.currentAvgLoss;
            state.committedInitGains = state.currentInitGains;
            state.committedInitLosses = state.currentInitLosses;
            state.lastIdx = context.idx;
        }

        // Rollback logic: always initialize current bar's tentative state from committed state
        state.currentPrevValue = state.committedPrevValue;
        state.currentAvgGain = state.committedAvgGain;
        state.currentAvgLoss = state.committedAvgLoss;
        state.currentInitGains = state.committedInitGains;
        state.currentInitLosses = state.committedInitLosses;

        const currentValue = Series.from(source).get(0);

        // Skip NaN/null/undefined values — don't advance RSI state
        if (currentValue === null || currentValue === undefined || Number.isNaN(currentValue)) {
            state.currentResult = NaN;
            return NaN;
        }

        const prevValue = state.currentPrevValue;

        // First valid bar or previous was NaN/null — store value, don't compute diff
        if (prevValue === null || Number.isNaN(prevValue)) {
            state.currentPrevValue = currentValue;
            state.currentResult = NaN;
            return NaN;
        }

        let avgGain = state.currentAvgGain;
        let avgLoss = state.currentAvgLoss;
        const initGains = state.currentInitGains.length < period ? [...state.currentInitGains] : state.currentInitGains;
        const initLosses = state.currentInitLosses.length < period ? [...state.currentInitLosses] : state.currentInitLosses;

        const diff = currentValue - prevValue;
        const gain = diff > 0 ? diff : 0;
        const loss = diff < 0 ? -diff : 0;

        if (initGains.length < period) {
            initGains.push(gain);
            initLosses.push(loss);

            state.currentInitGains = initGains;
            state.currentInitLosses = initLosses;
            state.currentPrevValue = currentValue;

            if (initGains.length === period) {
                avgGain = initGains.reduce((a, b) => a + b, 0) / period;
                avgLoss = initLosses.reduce((a, b) => a + b, 0) / period;

                state.currentAvgGain = avgGain;
                state.currentAvgLoss = avgLoss;

                const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
                state.currentResult = context.precision(rsi);
                return state.currentResult;
            }
            state.currentResult = NaN;
            return NaN;
        }

        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;

        state.currentAvgGain = avgGain;
        state.currentAvgLoss = avgLoss;
        state.currentPrevValue = currentValue;

        const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
        state.currentResult = context.precision(rsi);
        return state.currentResult;
    };
}
