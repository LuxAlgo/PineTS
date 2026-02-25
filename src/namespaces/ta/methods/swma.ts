// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * SWMA - Symmetrically Weighted Moving Average
 *
 * Pine Script's ta.swma() uses a fixed period of 4 bars with symmetric weights.
 * The weights are applied symmetrically: the current and 3 previous bars.
 *
 * Weights for 4-bar period: [1, 2, 2, 1]
 * Formula: SWMA = (price[3]*1 + price[2]*2 + price[1]*2 + price[0]*1) / 6
 *
 * @param source - The data source (typically close price)
 *
 * Note: Unlike other moving averages, SWMA has a fixed period of 4 in Pine Script
 */
export function swma(context: any) {
    return (source: any, _callId?: string) => {
        const period = 4; // Fixed period for SWMA
        const weights = [1, 2, 2, 1]; // Symmetric weights
        const weightSum = 6; // Sum of weights

        // Incremental SWMA calculation using rolling window
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `swma`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: -1,
                // Committed state
                prevWindow: [],
                // Tentative state
                currentWindow: [],
            };
        }

        const state = context.taState[stateKey];

        // Commit logic
        if (context.idx > state.lastIdx) {
            if (state.lastIdx >= 0) {
                state.prevWindow = [...state.currentWindow];
            }
            state.lastIdx = context.idx;
        }

        const currentValue = Series.from(source).get(0);

        // Use committed state
        const window = [...state.prevWindow];

        // Add current value to window (most recent at front)
        window.unshift(currentValue);

        while (window.length > period) {
            window.pop();
        }

        // Backfill from source if window is undersized (dynamic length recovery)
        if (window.length < period && context.idx >= period - 1) {
            const series = Series.from(source);
            while (window.length < period) {
                window.push(series.get(window.length));
            }
        }

        // Update tentative state
        state.currentWindow = window;

        if (window.length < period) {
            return NaN;
        }

        // Calculate symmetrically weighted average
        let swma = 0;
        for (let i = 0; i < period; i++) {
            swma += weights[i] * window[period - 1 - i];
        }
        swma /= weightSum;

        return context.precision(swma);
    };
}
