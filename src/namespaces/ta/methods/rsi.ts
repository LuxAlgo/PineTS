// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function rsi(context: any) {
    return (source: any, _period: any, _callId?: string) => {
        const period = Series.from(_period).get(0);
        if (period <= 0) return NaN;

        // Incremental RSI calculation
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `rsi_${period}`;

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
            if (context.idx > 0) {
                rebuildRsi(context.taState[stateKey], source, period, context.idx);
                context.taState[stateKey].lastIdx = context.idx;
            }
        }

        const state = context.taState[stateKey];

        // Handle gap/conditional execution: catch up skipped bars from series
        if (context.idx > state.lastIdx + 1) {
            const series = Series.from(source);
            // Catch up starting from state.lastIdx (re-evaluating it with the closed series value)
            // up to context.idx - 1.
            for (let i = state.lastIdx; i < context.idx; i++) {
                const dist = context.idx - i;
                const val = series.get(dist);
                if (val === null || val === undefined || Number.isNaN(val)) {
                    continue;
                }
                const prevVal = state.committedPrevValue;
                if (prevVal === null || Number.isNaN(prevVal)) {
                    state.committedPrevValue = val;
                    continue;
                }
                const diff = val - prevVal;
                const gain = diff > 0 ? diff : 0;
                const loss = diff < 0 ? -diff : 0;

                if (state.committedInitGains.length < period) {
                    state.committedInitGains.push(gain);
                    state.committedInitLosses.push(loss);
                    state.committedPrevValue = val;

                    if (state.committedInitGains.length === period) {
                        state.committedAvgGain = state.committedInitGains.reduce((a: number, b: number) => a + b, 0) / period;
                        state.committedAvgLoss = state.committedInitLosses.reduce((a: number, b: number) => a + b, 0) / period;
                    }
                } else {
                    state.committedAvgGain = (state.committedAvgGain * (period - 1) + gain) / period;
                    state.committedAvgLoss = (state.committedAvgLoss * (period - 1) + loss) / period;
                    state.committedPrevValue = val;
                }
            }
            state.lastIdx = context.idx - 1;

            // Sync tentative state with newly caught-up committed state
            state.currentPrevValue = state.committedPrevValue;
            state.currentAvgGain = state.committedAvgGain;
            state.currentAvgLoss = state.committedAvgLoss;
            state.currentInitGains = [...state.committedInitGains];
            state.currentInitLosses = [...state.committedInitLosses];
        }

        // Commit logic: lock previous tentative state
        if (context.idx > state.lastIdx) {
            state.committedPrevValue = state.currentPrevValue;
            state.committedAvgGain = state.currentAvgGain;
            state.committedAvgLoss = state.currentAvgLoss;
            state.committedInitGains = [...state.currentInitGains];
            state.committedInitLosses = [...state.currentInitLosses];
            state.lastIdx = context.idx;
        }

        // Rollback logic: always initialize current bar's tentative state from committed state
        state.currentPrevValue = state.committedPrevValue;
        state.currentAvgGain = state.committedAvgGain;
        state.currentAvgLoss = state.committedAvgLoss;
        state.currentInitGains = [...state.committedInitGains];
        state.currentInitLosses = [...state.committedInitLosses];

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
        const initGains = [...state.currentInitGains];
        const initLosses = [...state.currentInitLosses];

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

function rebuildRsi(state: any, source: any, period: number, currentIdx: number) {
    const series = Series.from(source);
    const lookback = Math.min(currentIdx, 250);
    const startIdx = currentIdx - lookback;

    let prevVal: number | null = null;
    const initGains: number[] = [];
    const initLosses: number[] = [];
    let avgGain = 0;
    let avgLoss = 0;

    for (let i = startIdx; i < currentIdx; i++) {
        const val = series.get(currentIdx - i);
        if (val === null || val === undefined || Number.isNaN(val)) {
            continue;
        }
        if (prevVal === null || Number.isNaN(prevVal)) {
            prevVal = val;
            continue;
        }
        const diff = val - prevVal;
        const gain = diff > 0 ? diff : 0;
        const loss = diff < 0 ? -diff : 0;

        if (initGains.length < period) {
            initGains.push(gain);
            initLosses.push(loss);
            prevVal = val;

            if (initGains.length === period) {
                avgGain = initGains.reduce((a, b) => a + b, 0) / period;
                avgLoss = initLosses.reduce((a, b) => a + b, 0) / period;
            }
        } else {
            avgGain = (avgGain * (period - 1) + gain) / period;
            avgLoss = (avgLoss * (period - 1) + loss) / period;
            prevVal = val;
        }
    }

    state.committedPrevValue = prevVal;
    state.committedAvgGain = avgGain;
    state.committedAvgLoss = avgLoss;
    state.committedInitGains = initGains;
    state.committedInitLosses = initLosses;
}
