// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function atr(context: any): //
//PineScript signature
(length: number) => Series {
    return (_period: number, _callId?: string) => {
        const period = Series.from(_period).get(0);

        // Incremental ATR calculation
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `atr_${period}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: -1,
                // Committed state
                prevAtr: null,
                prevInitSum: 0,
                prevInitCount: 0,
                // Tentative state
                currentAtr: null,
                currentInitSum: 0,
                currentInitCount: 0,
            };
        }

        const state = context.taState[stateKey];

        // Commit logic
        if (context.idx > state.lastIdx) {
            if (state.lastIdx >= 0) {
                state.prevAtr = state.currentAtr;
                state.prevInitSum = state.currentInitSum;
                state.prevInitCount = state.currentInitCount;
            }
            state.lastIdx = context.idx;
        }

        const high = context.get(context.data.high, 0);
        const low = context.get(context.data.low, 0);
        const close = context.get(context.data.close, 0);

        // Fix: Handle NaN inputs
        if (isNaN(high) || isNaN(low) || isNaN(close)) {
            return NaN;
        }

        // Read previous close directly from context data — always correct
        // regardless of whether ATR was called on previous bars.
        // This fixes the stale-prevClose bug when ATR is called conditionally.
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

        let initCount = state.prevInitCount;
        let initSum = state.prevInitSum;
        let prevAtr = state.prevAtr;

        if (initCount < period) {
            // Accumulate TR for SMA initialization
            initSum += tr;
            initCount++;

            // Store tentative state
            state.currentInitSum = initSum;
            state.currentInitCount = initCount;

            if (initCount === period) {
                const atr = initSum / period;
                state.currentAtr = atr;
                return context.precision(atr);
            }
            return NaN;
        }

        // Calculate ATR using RMA formula
        const atr = (prevAtr * (period - 1) + tr) / period;

        // Store tentative result
        state.currentAtr = atr;

        return context.precision(atr);
    };
}
