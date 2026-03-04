// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Commodity Channel Index (CCI)
 *
 * CCI measures the deviation of the price from its average price.
 * It's used to identify cyclical trends and overbought/oversold conditions.
 *
 * Formula:
 * - Typical Price (TP) = (high + low + close) / 3
 * - CCI = (TP - SMA(TP, length)) / (0.015 × Mean Deviation)
 * - Mean Deviation = Average of |TP - SMA(TP)| over length periods
 *
 * @param source - Source series (typically close price, but can be any price)
 * @param length - Number of bars back (lookback period)
 * @returns CCI value
 *
 * @remarks
 * - Returns NaN during initialization period (when not enough data)
 * - The constant 0.015 ensures approximately 70-80% of values fall between -100 and +100
 */
export function cci(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);

        // Use incremental calculation with rolling window
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `cci_${length}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: -1,
                // Committed state
                prevWindow: [],
                prevSum: 0,
                prevCallCount: 0,
                // Tentative state
                currentWindow: [],
                currentSum: 0,
                currentCallCount: 0,
            };
        }

        const state = context.taState[stateKey];

        // Commit logic
        if (context.idx > state.lastIdx) {
            if (state.lastIdx >= 0) {
                state.prevWindow = [...state.currentWindow];
                state.prevSum = state.currentSum;
                state.prevCallCount = state.currentCallCount;
            }
            state.lastIdx = context.idx;
        }

        const currentValue = Series.from(source).get(0);

        // Handle NaN input
        if (isNaN(currentValue)) {
            // Update tentative state with previous values (no change effectively, or should we reset?)
            // Standard Pine behavior usually propagates NaN. For rolling window, we probably skip or push NaN?
            // If input is NaN, CCI is usually NaN.
            return NaN;
        }

        // Use committed state
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

        // Track actual call count for callsite-correct backfill
        const callCount = state.prevCallCount + 1;
        if (window.length < length && (callCount >= length || context.idx >= length - 1)) {
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
        state.currentCallCount = callCount;

        // Not enough data yet
        if (window.length < length) {
            return NaN;
        }

        // Calculate SMA (mean)
        const sma = sum / length;

        // Calculate Mean Deviation
        let sumAbsoluteDeviations = 0;
        for (let i = 0; i < length; i++) {
            sumAbsoluteDeviations += Math.abs(window[i] - sma);
        }
        const meanDeviation = sumAbsoluteDeviations / length;

        // Avoid division by zero
        if (meanDeviation === 0) {
            return 0;
        }

        // Calculate CCI
        const cci = (currentValue - sma) / (0.015 * meanDeviation);

        return context.precision(cci);
    };
}
