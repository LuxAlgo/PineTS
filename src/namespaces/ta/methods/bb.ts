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
        if (length <= 0) {
            return [[NaN, NaN, NaN]];
        }

        // Incremental Bollinger Bands calculation using circular buffer
        if (!context.taState) context.taState = {};
        const stateKey = _callId ? `${_callId}_${length}_${mult}` : `bb_${length}_${mult}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: context.idx - 1,
                committedValues: new Array(length),
                committedHead: 0,
                committedCount: 0,
                values: new Array(length),
                head: 0,
                count: 0,
                currentResult: [[NaN, NaN, NaN]],
            };
            if (context.idx > 0) {
                rebuildRollingBb(context.taState[stateKey], source, length);
                context.taState[stateKey].lastIdx = context.idx;
            }
        }

        const state = context.taState[stateKey];

        // Handle gap/conditional execution: rebuild from series if we skipped bars
        if (context.idx > state.lastIdx + 1) {
            rebuildRollingBb(state, source, length);
            state.lastIdx = context.idx;
        }

        // Commit logic: lock previous tentative state
        if (context.idx > state.lastIdx) {
            state.committedValues = [...state.values];
            state.committedHead = state.head;
            state.committedCount = state.count;
            state.lastIdx = context.idx;
        }

        // Rollback logic: always initialize current bar's tentative state from committed state
        state.values = [...state.committedValues];
        state.head = state.committedHead;
        state.count = state.committedCount;

        const currentValue = Series.from(source).get(0);
        const value = currentValue === undefined || currentValue === null ? NaN : Number(currentValue);

        if (state.count < length) {
            state.values[state.count] = value;
            state.count += 1;
        } else {
            state.values[state.head] = value;
            state.head += 1;
            if (state.head === length) state.head = 0;
        }

        if (state.count < length) {
            state.currentResult = [[NaN, NaN, NaN]];
            return [[NaN, NaN, NaN]];
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
            state.currentResult = [[NaN, NaN, NaN]];
            return [[NaN, NaN, NaN]];
        }

        const middle = sum / length;
        let sumSquaredDiff = 0;

        for (let j = 0; j < length; j++) {
            const idx = (lastInserted - j + length) % length;
            sumSquaredDiff += Math.pow(state.values[idx] - middle, 2);
        }

        const stdev = Math.sqrt(sumSquaredDiff / length);
        const upper = middle + mult * stdev;
        const lower = middle - mult * stdev;

        state.currentResult = [[context.precision(middle), context.precision(upper), context.precision(lower)]];
        return state.currentResult;
    };
}

function rebuildRollingBb(state: any, source: any, length: number) {
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
}
