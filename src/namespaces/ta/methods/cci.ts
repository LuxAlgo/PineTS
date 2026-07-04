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
        if (length <= 0) return NaN;

        // Use incremental calculation with circular buffer
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `cci_${length}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: context.idx - 1,
                // Circular buffer committed state
                committedValues: new Array(length),
                committedHead: 0,
                committedCount: 0,
                committedCallCount: 0,
                // Circular buffer tentative state
                values: new Array(length),
                head: 0,
                count: 0,
                callCount: 0,
                currentResult: NaN,
            };
            if (context.idx > 0) {
                rebuildRollingCci(context.taState[stateKey], source, length);
                context.taState[stateKey].lastIdx = context.idx;
            }
        }

        const state = context.taState[stateKey];

        // Handle gap/conditional execution: rebuild from series if we skipped bars
        if (context.idx > state.lastIdx + 1) {
            rebuildRollingCci(state, source, length);
            state.lastIdx = context.idx;
        }

        // Commit logic: lock previous tentative state
        if (context.idx > state.lastIdx) {
            state.committedValues = [...state.values];
            state.committedHead = state.head;
            state.committedCount = state.count;
            state.committedCallCount = state.callCount;
            state.lastIdx = context.idx;
        }

        // Rollback logic: always initialize current bar's tentative state from committed state
        state.values = [...state.committedValues];
        state.head = state.committedHead;
        state.count = state.committedCount;
        state.callCount = state.committedCallCount;

        const currentValue = Series.from(source).get(0);
        const value = currentValue === undefined || currentValue === null ? NaN : Number(currentValue);

        // Handle NaN input
        if (isNaN(value)) {
            state.currentResult = NaN;
            return NaN;
        }

        if (state.count < length) {
            state.values[state.count] = value;
            state.count += 1;
        } else {
            state.values[state.head] = value;
            state.head += 1;
            if (state.head === length) state.head = 0;
        }

        state.callCount += 1;

        // Backfill from source if window is undersized
        if (state.count < length && (state.callCount >= length || context.idx >= length - 1)) {
            const series = Series.from(source);
            while (state.count < length) {
                const val = series.get(state.count);
                if (isNaN(val)) break;
                state.values[state.count] = val;
                state.count += 1;
            }
        }

        if (state.count < length) {
            state.currentResult = NaN;
            return NaN;
        }

        let sum = 0;
        let hasNaN = false;

        const lastInserted = (state.head - 1 + length) % length;
        for (let j = 0; j < length; j++) {
            const idx = (lastInserted - j + length) % length;
            const v = state.values[idx];
            if (v === undefined || v === null || Number.isNaN(v)) {
                hasNaN = true;
                break;
            }
            sum += v;
        }

        if (hasNaN) {
            state.currentResult = NaN;
            return NaN;
        }

        const sma = sum / length;

        // Calculate Mean Deviation newest-to-oldest
        let sumAbsoluteDeviations = 0;
        for (let j = 0; j < length; j++) {
            const idx = (lastInserted - j + length) % length;
            sumAbsoluteDeviations += Math.abs(state.values[idx] - sma);
        }
        const meanDeviation = sumAbsoluteDeviations / length;

        if (meanDeviation === 0) {
            state.currentResult = 0;
            return 0;
        }

        const cci = (value - sma) / (0.015 * meanDeviation);
        state.currentResult = context.precision(cci);

        return state.currentResult;
    };
}

function rebuildRollingCci(state: any, source: any, length: number) {
    const tempValues = [];
    let tempCount = 0;
    const series = Series.from(source);
    for (let i = 1; i <= length; i++) {
        const rawV = series.get(i);
        const v = rawV === undefined || rawV === null ? NaN : Number(rawV);
        if (Number.isFinite(v)) {
            tempValues.unshift(v); // oldest to newest
            tempCount++;
        } else {
            break;
        }
    }
    state.committedValues = new Array(length);
    for (let i = 0; i < tempCount; i++) {
        state.committedValues[i] = tempValues[i];
    }
    state.committedHead = 0;
    state.committedCount = tempCount;
    state.committedCallCount = tempCount;
}
