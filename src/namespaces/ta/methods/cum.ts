// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Cumulative Sum (CUM)
 *
 * Returns the cumulative sum of the source values from the first bar to the current bar.
 * The cumulative sum is the running total of all values.
 *
 * Formula:
 * - CUM[0] = source[0]
 * - CUM[n] = CUM[n-1] + source[n]
 *
 * @param source - The data source to accumulate
 * @returns The cumulative sum up to the current bar
 */
export function cum(context: any) {
    return (source: any, _callId?: string) => {
        // Initialize state for cumulative calculation
        if (!context.taState) context.taState = {};
        const stateKey = _callId || 'cum';

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: -1,
                // Committed state
                prevCumulativeSum: 0,
                // Tentative state
                currentCumulativeSum: 0,
            };
        }

        const state = context.taState[stateKey];

        // Commit logic
        if (context.idx > state.lastIdx) {
            if (state.lastIdx >= 0) {
                state.prevCumulativeSum = state.currentCumulativeSum;
            }
            state.lastIdx = context.idx;
        }

        const currentValue = Series.from(source).get(0);

        // An na bar returns na and adds nothing (TradingView), so bars before the first value are na too.
        if (isNaN(currentValue)) {
            state.currentCumulativeSum = state.prevCumulativeSum;
            return NaN;
        }

        // Add current value to committed cumulative sum
        const currentSum = state.prevCumulativeSum + currentValue;
        
        // Update tentative state
        state.currentCumulativeSum = currentSum;

        return context.precision(currentSum);
    };
}
