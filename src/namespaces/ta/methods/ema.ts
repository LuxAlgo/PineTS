// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Exponential Moving Average (EMA)
 *
 * Formula:
 * - EMA = source * alpha + prevEMA * (1 - alpha)
 * - alpha = 2 / (period + 1)
 *
 * @param source - Source series
 * @param period - Period of EMA
 * @returns EMA value
 */
export function ema(context: any) {
    return (source: any, _period: any, _callId?: string) => {
        const period = Series.from(_period).get(0);

        // Incremental EMA calculation
        if (!context.taState) context.taState = {};
        const stateKey = _callId ? `${_callId}_${period}` : `ema_${period}`;

        // Initialize state structure
        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: -1,
                // Committed state (from end of lastIdx-1)
                prevEma: null,
                prevInitSum: 0,
                prevInitCount: 0,
                // Tentative state (for current lastIdx)
                currentEma: null,
                currentInitSum: 0,
                currentInitCount: 0,
            };

        }

        const state = context.taState[stateKey];

        // Check if we moved to a new bar index
        if (context.idx > state.lastIdx) {
            // Commit the tentative state from the previous bar to be the new "prev" state
            if (state.lastIdx >= 0) {
                state.prevEma = state.currentEma;
                state.prevInitSum = state.currentInitSum;
                state.prevInitCount = state.currentInitCount;
            }
            state.lastIdx = context.idx;
        }

        const currentValue = Series.from(source).get(0);

        if (currentValue === null || currentValue === undefined || isNaN(currentValue)) {
            return NaN;
        }

        // Use 'prev' variables for calculation to ensure stability during live updates
        // We calculate 'current' values but DO NOT overwrite 'prev' values yet
        let initCount = state.prevInitCount;
        let initSum = state.prevInitSum;
        let prevEma = state.prevEma;

        if (initCount < period) {
            // Accumulate for SMA initialization
            initSum += currentValue;
            initCount++;

            // Store tentative state
            state.currentInitSum = initSum;
            state.currentInitCount = initCount;

            if (initCount === period) {
                const ema = initSum / period;
                state.currentEma = ema;
                return context.precision(ema);
            }
            return NaN;
        }

        // Calculate EMA incrementally: EMA = alpha * current + (1 - alpha) * prevEMA
        const alpha = 2 / (period + 1);
        const ema = currentValue * alpha + prevEma * (1 - alpha);

        // Store tentative result
        state.currentEma = ema;

        return context.precision(ema);
    };
}
