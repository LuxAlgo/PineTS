// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function stdev(context: any) {
    return (source: any, _length: any, _bias: any = true, _callId?: string) => {
        const length = Series.from(_length).get(0);
        const bias = Series.from(_bias).get(0);
        if (length <= 0) return NaN;

        if (!context.taState) context.taState = {};
        const stateKey = _callId ? `${_callId}_${length}_${bias}` : `stdev_${length}_${bias}`;

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
                currentResult: NaN,
            };
            if (context.idx > 0) rebuildRollingStdev(context.taState[stateKey], source, length);
        }

        const state = context.taState[stateKey];
        if (context.idx > state.lastIdx + 1) rebuildRollingStdev(state, source, length);

        if (context.idx > state.lastIdx) {
            state.rollbackHead = state.head;
            state.rollbackCount = state.count;
            state.rollbackIndex = state.count < length ? state.count : state.head;
            state.rollbackValue = state.values[state.rollbackIndex];
            state.lastIdx = context.idx;
        } else {
            state.head = state.rollbackHead;
            state.count = state.rollbackCount;
            state.values[state.rollbackIndex] = state.rollbackValue;
        }

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
            state.currentResult = NaN;
            return NaN;
        }

        let sum = 0;
        for (let index = state.head - 1; index >= 0; index -= 1) {
            const item = state.values[index];
            if (item === undefined || item === null || Number.isNaN(item)) {
                state.currentResult = NaN;
                return NaN;
            }
            sum += item;
        }
        for (let index = length - 1; index >= state.head; index -= 1) {
            const item = state.values[index];
            if (item === undefined || item === null || Number.isNaN(item)) {
                state.currentResult = NaN;
                return NaN;
            }
            sum += item;
        }

        const mean = sum / length;
        let sumSquaredDiff = 0;
        for (let index = state.head - 1; index >= 0; index -= 1) {
            const item = state.values[index];
            sumSquaredDiff += Math.pow(item - mean, 2);
        }
        for (let index = length - 1; index >= state.head; index -= 1) {
            const item = state.values[index];
            sumSquaredDiff += Math.pow(item - mean, 2);
        }

        const divisor = bias ? length : length - 1;
        if (divisor <= 0) {
            state.currentResult = NaN;
            return NaN;
        }

        state.currentResult = context.precision(Math.sqrt(sumSquaredDiff / divisor));
        return state.currentResult;
    };
}

function rebuildRollingStdev(state: any, source: any, length: number) {
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
}
