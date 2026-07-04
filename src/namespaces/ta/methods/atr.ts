// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function atr(context: any): //
//PineScript signature
(length: number) => Series {
    return (_period: number, _callId?: string) => {
        const period = Series.from(_period).get(0);
        if (period <= 0) return NaN;

        // Incremental ATR calculation
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `atr_${period}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: context.idx - 1,
                // Committed state
                committedAtr: null,
                committedInitSum: 0,
                committedInitCount: 0,
                // Tentative state
                currentAtr: null,
                currentInitSum: 0,
                currentInitCount: 0,
                currentResult: NaN,
            };
            if (context.idx > 0) {
                rebuildAtr(context.taState[stateKey], context, period, context.idx);
                context.taState[stateKey].lastIdx = context.idx;
            }
        }

        const state = context.taState[stateKey];

        // Handle gap/conditional execution: catch up skipped bars from series
        if (context.idx > state.lastIdx + 1) {
            const highSeries = Series.from(context.data.high);
            const lowSeries = Series.from(context.data.low);
            const closeSeries = Series.from(context.data.close);

            for (let i = state.lastIdx; i < context.idx; i++) {
                const dist = context.idx - i;
                const high = highSeries.get(dist);
                const low = lowSeries.get(dist);
                const close = closeSeries.get(dist);
                const prevClose = closeSeries.get(dist + 1);

                if (isNaN(high) || isNaN(low) || isNaN(close)) {
                    continue;
                }

                let tr;
                if (prevClose !== null && !isNaN(prevClose)) {
                    tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
                } else {
                    tr = high - low;
                }

                if (state.committedInitCount < period) {
                    state.committedInitSum += tr;
                    state.committedInitCount++;
                    if (state.committedInitCount === period) {
                        state.committedAtr = state.committedInitSum / period;
                    }
                } else {
                    state.committedAtr = (state.committedAtr * (period - 1) + tr) / period;
                }
            }
            state.lastIdx = context.idx - 1;

            // Sync tentative state with newly caught-up committed state
            state.currentAtr = state.committedAtr;
            state.currentInitSum = state.committedInitSum;
            state.currentInitCount = state.committedInitCount;
        }

        // Commit logic
        if (context.idx > state.lastIdx) {
            state.committedAtr = state.currentAtr;
            state.committedInitSum = state.currentInitSum;
            state.committedInitCount = state.currentInitCount;
            state.lastIdx = context.idx;
        }

        // Rollback logic
        state.currentAtr = state.committedAtr;
        state.currentInitSum = state.committedInitSum;
        state.currentInitCount = state.committedInitCount;

        const high = context.get(context.data.high, 0);
        const low = context.get(context.data.low, 0);
        const close = context.get(context.data.close, 0);

        // Fix: Handle NaN inputs
        if (isNaN(high) || isNaN(low) || isNaN(close)) {
            state.currentResult = NaN;
            return NaN;
        }

        // Read previous close directly from context data
        const prevClose = context.idx > 0 ? context.get(context.data.close, 1) : null;

        // Calculate True Range
        let tr;
        if (prevClose !== null && !isNaN(prevClose)) {
            const hl = high - low;
            const hc = Math.abs(high - prevClose);
            const lc = Math.abs(low - prevClose);
            tr = Math.max(hl, hc, lc);
        } else {
            tr = high - low;
        }

        let initCount = state.currentInitCount;
        let initSum = state.currentInitSum;
        let prevAtr = state.currentAtr;

        if (initCount < period) {
            initSum += tr;
            initCount++;

            state.currentInitSum = initSum;
            state.currentInitCount = initCount;

            if (initCount === period) {
                const atr = initSum / period;
                state.currentAtr = atr;
                state.currentResult = context.precision(atr);
                return state.currentResult;
            }
            state.currentResult = NaN;
            return NaN;
        }

        // Calculate ATR using RMA formula
        const atr = (prevAtr * (period - 1) + tr) / period;
        state.currentAtr = atr;
        state.currentResult = context.precision(atr);

        return state.currentResult;
    };
}

function rebuildAtr(state: any, context: any, period: number, currentIdx: number) {
    const highSeries = Series.from(context.data.high);
    const lowSeries = Series.from(context.data.low);
    const closeSeries = Series.from(context.data.close);

    const lookback = Math.min(currentIdx, 250);
    const startIdx = currentIdx - lookback;

    let initSum = 0;
    let initCount = 0;
    let atr = null;

    for (let i = startIdx; i < currentIdx; i++) {
        const dist = currentIdx - i;
        const high = highSeries.get(dist);
        const low = lowSeries.get(dist);
        const close = closeSeries.get(dist);
        const prevClose = closeSeries.get(dist + 1);

        if (isNaN(high) || isNaN(low) || isNaN(close)) {
            continue;
        }

        let tr;
        if (prevClose !== null && !isNaN(prevClose)) {
            tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
        } else {
            tr = high - low;
        }

        if (initCount < period) {
            initSum += tr;
            initCount++;
            if (initCount === period) {
                atr = initSum / period;
            }
        } else {
            atr = (atr * (period - 1) + tr) / period;
        }
    }

    state.committedAtr = atr;
    state.committedInitSum = initSum;
    state.committedInitCount = initCount;
}
