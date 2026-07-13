// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Average True Range (ATR)
 *
 * Formula:
 * - ATR = (prevATR * (period - 1) + TR) / period
 * - TR = max(high - low, |high - prevClose|, |low - prevClose|)
 *
 * @param length - Lookback period for ATR
 * @returns ATR value series
 */
export function atr(context: any): //
//PineScript signature
(length: number) => Series {
    return (_period: number, _callId?: string) => {
        const period = Series.from(_period).get(0);
        if (period <= 0) return NaN;

        // Incremental ATR calculation
        if (!context.taState) context.taState = {};
        const stateKey = _callId ? `${_callId}_${period}` : `atr_${period}`;

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
        }

        const state = context.taState[stateKey];

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
