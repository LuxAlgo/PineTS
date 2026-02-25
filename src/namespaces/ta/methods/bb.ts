// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Bollinger Bands (BB)
 *
 * Bollinger Bands are volatility bands placed above and below a moving average.
 * Volatility is based on the standard deviation, which changes as volatility increases and decreases.
 *
 * Formula:
 * - Middle Band = SMA(source, length)
 * - Upper Band = Middle Band + (multiplier × Standard Deviation)
 * - Lower Band = Middle Band - (multiplier × Standard Deviation)
 *
 * @param source - The data source (typically close price)
 * @param length - The period for SMA and standard deviation (default 20)
 * @param mult - The multiplier for standard deviation (default 2)
 * @returns [upper, middle, lower]
 */
export function bb(context: any) {
    return (source: any, _length: any, _mult: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        const mult = Series.from(_mult).get(0);

        // Use incremental calculation with rolling window
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `bb_${length}_${mult}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: -1,
                // Committed state
                prevWindow: [],
                prevSum: 0,
                // Tentative state
                currentWindow: [],
                currentSum: 0,
            };
        }

        const state = context.taState[stateKey];

        // Commit logic
        if (context.idx > state.lastIdx) {
            if (state.lastIdx >= 0) {
                state.prevWindow = [...state.currentWindow];
                state.prevSum = state.currentSum;
            }
            state.lastIdx = context.idx;
        }

        const currentValue = Series.from(source).get(0);

        // Handle NaN input
        if (isNaN(currentValue)) {
            state.currentWindow = [...state.prevWindow];
            state.currentSum = state.prevSum;
            return [[NaN, NaN, NaN]];
        }

        // Use committed state to calculate current state
        const window = [...state.prevWindow];
        let sum = state.prevSum;

        // Add current value to window
        window.unshift(currentValue);
        sum += currentValue;

        // Remove oldest value if window exceeds length
        while (window.length > length) {
            const oldValue = window.pop();
            sum -= oldValue;
        }

        // Backfill from source if window is undersized (dynamic length recovery)
        // Break on NaN since this function intentionally excludes NaN from the window
        if (window.length < length && context.idx >= length - 1) {
            const series = Series.from(source);
            while (window.length < length) {
                const val = series.get(window.length);
                if (isNaN(val)) break;
                window.push(val);
                sum += val;
            }
        }

        // Update tentative state
        state.currentWindow = window;
        state.currentSum = sum;

        // Not enough data yet
        if (window.length < length) {
            return [[NaN, NaN, NaN]];
        }

        // Calculate middle band (SMA)
        const middle = sum / length;

        // Calculate standard deviation
        let sumSquaredDiff = 0;
        for (let i = 0; i < length; i++) {
            sumSquaredDiff += Math.pow(window[i] - middle, 2);
        }
        const stdev = Math.sqrt(sumSquaredDiff / length);

        // Calculate upper and lower bands
        const upper = middle + mult * stdev;
        const lower = middle - mult * stdev;

        // Return as tuple with double brackets
        return [[context.precision(middle), context.precision(upper), context.precision(lower)]];
    };
}
