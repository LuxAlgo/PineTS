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
        if (length <= 0) return [[NaN, NaN, NaN]];

        if (!context.taState) context.taState = {};
        const stateKey = _callId ? `${_callId}_${length}_${mult}` : `bb_${length}_${mult}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: context.idx - 1,
                values: new Array(length),
                head: 0,
                count: 0,
                rollbackHead: 0,
                rollbackCount: 0,
                rollbackIndex: 0,
                rollbackValue: undefined,
                sum: 0,
                nanCount: 0,
                rollbackSum: 0,
                rollbackNaNCount: 0,
                currentResult: [[NaN, NaN, NaN]],
            };
            if (context.idx > 0) rebuildRollingBb(context.taState[stateKey], source, length);
        }

        const state = context.taState[stateKey];
        if (context.idx > state.lastIdx + 1) rebuildRollingBb(state, source, length);

        if (context.idx > state.lastIdx) {
            state.rollbackHead = state.head;
            state.rollbackCount = state.count;
            state.rollbackIndex = state.count < length ? state.count : state.head;
            state.rollbackValue = state.values[state.rollbackIndex];
            state.rollbackSum = state.sum;
            state.rollbackNaNCount = state.nanCount;
            state.lastIdx = context.idx;
        } else {
            state.head = state.rollbackHead;
            state.count = state.rollbackCount;
            state.values[state.rollbackIndex] = state.rollbackValue;
            state.sum = state.rollbackSum;
            state.nanCount = state.rollbackNaNCount;
        }

        const currentValue = Series.from(source).get(0);
        const value = currentValue === undefined || currentValue === null ? NaN : Number(currentValue);
        if (state.count < length) {
            state.values[state.count] = value;
            state.count += 1;
        } else {
            const evicted = state.values[state.head];
            if (Number.isNaN(evicted)) {
                state.nanCount -= 1;
            } else {
                state.sum -= evicted;
            }
            state.values[state.head] = value;
            state.head += 1;
            if (state.head === length) state.head = 0;
        }

        if (Number.isNaN(value)) {
            state.nanCount += 1;
        } else {
            state.sum += value;
        }

        if (state.count < length || state.nanCount > 0) {
            state.currentResult = [[NaN, NaN, NaN]];
            return state.currentResult;
        }

        let sum = 0;
        for (let index = state.head - 1; index >= 0; index -= 1) {
            sum += state.values[index];
        }
        for (let index = length - 1; index >= state.head; index -= 1) {
            sum += state.values[index];
        }
        const middle = sum / length;
        let sumSquaredDiff = 0;
        for (let index = state.head - 1; index >= 0; index -= 1) {
            sumSquaredDiff += Math.pow(state.values[index] - middle, 2);
        }
        for (let index = length - 1; index >= state.head; index -= 1) {
            sumSquaredDiff += Math.pow(state.values[index] - middle, 2);
        }

        const stdev = Math.sqrt(sumSquaredDiff / length);
        const upper = middle + mult * stdev;
        const lower = middle - mult * stdev;
        state.currentResult = [[context.precision(middle), context.precision(upper), context.precision(lower)]];
        return state.currentResult;
    };
}

function rebuildRollingBb(state: any, source: any, length: number) {
    const values = [];
    const series = Series.from(source);
    for (let offset = 1; offset <= length; offset += 1) {
        const rawValue = series.get(offset);
        const value = rawValue === undefined || rawValue === null ? NaN : Number(rawValue);
        if (!Number.isFinite(value)) break;
        values.unshift(value);
    }
    state.values = new Array(length);
    for (let index = 0; index < values.length; index += 1) state.values[index] = values[index];
    state.head = 0;
    state.count = values.length;
    state.sum = values.reduce((sum: number, value: number) => sum + value, 0);
    state.nanCount = 0;
}
