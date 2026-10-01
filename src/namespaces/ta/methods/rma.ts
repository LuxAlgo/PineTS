// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function rma(context: any) {
    return (source: any, _period: any, _callId?: string) => {
        const period = Series.from(_period).get(0);

        // Incremental RMA calculation
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `rma_${period}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: -1,
                // Committed state
                prevRma: null,
                prevInitSum: 0,
                prevInitCount: 0,
                // Tentative state
                currentRma: null,
                currentInitSum: 0,
                currentInitCount: 0,
            };
        }

        const state = context.taState[stateKey];

        // Commit logic
        if (context.idx > state.lastIdx) {
            if (state.lastIdx >= 0) {
                state.prevRma = state.currentRma;
                state.prevInitSum = state.currentInitSum;
                state.prevInitCount = state.currentInitCount;
            }
            state.lastIdx = context.idx;
        }

        const currentValue = Series.from(source).get(0);

        // An na bar returns na and leaves the average as it was (TradingView skips it, like ta.ema).
        if (currentValue === null || currentValue === undefined || Number.isNaN(currentValue)) {
            state.currentRma = state.prevRma;
            state.currentInitSum = state.prevInitSum;
            state.currentInitCount = state.prevInitCount;
            return NaN;
        }

        // Use committed state for calculation
        let initCount = state.prevInitCount;
        let initSum = state.prevInitSum;
        let prevRma = state.prevRma;

        if (initCount < period) {
            // Accumulate for SMA initialization
            initSum += currentValue;
            initCount++;

            // Update tentative state
            state.currentInitSum = initSum;
            state.currentInitCount = initCount;

            if (initCount === period) {
                const rma = initSum / period;
                state.currentRma = rma;
                return context.precision(rma);
            }
            return NaN;
        }

        // Calculate RMA incrementally: RMA = alpha * current + (1 - alpha) * prevRMA
        const alpha = 1 / period;
        const rma = currentValue * alpha + prevRma * (1 - alpha);

        // Update tentative state
        state.currentRma = rma;

        return context.precision(rma);
    };
}
