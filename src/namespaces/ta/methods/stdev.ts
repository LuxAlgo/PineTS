// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function stdev(context: any) {
    return (source: any, _length: any, _bias: any = true, _callId?: string) => {
        const length = Series.from(_length).get(0);
        const bias = Series.from(_bias).get(0);
        if (length <= 0) return NaN;

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `stdev_${length}_${bias}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: context.idx - 1,
                committedValues: new Array(length),
                committedHead: 0,
                committedCount: 0,
                values: new Array(length),
                head: 0,
                count: 0,
                currentResult: NaN,
            };
            if (context.idx > 0) {
                rebuildRollingStdev(context.taState[stateKey], source, length);
                context.taState[stateKey].lastIdx = context.idx;
            }
        }

        const state = context.taState[stateKey];

        if (context.idx > state.lastIdx + 1) {
            rebuildRollingStdev(state, source, length);
            state.lastIdx = context.idx;
        }

        if (context.idx > state.lastIdx) {
            state.committedValues = [...state.values];
            state.committedHead = state.head;
            state.committedCount = state.count;
            state.lastIdx = context.idx;
        }

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

        const mean = sum / length;
        let sumSquaredDiff = 0;

        for (let j = 0; j < length; j++) {
            const idx = (lastInserted - j + length) % length;
            sumSquaredDiff += Math.pow(state.values[idx] - mean, 2);
        }

        const divisor = bias ? length : length - 1;
        if (divisor <= 0) {
            state.currentResult = NaN;
            return NaN;
        }

        const val = Math.sqrt(sumSquaredDiff / divisor);
        state.currentResult = context.precision(val);
        return state.currentResult;
    };
}

function rebuildRollingStdev(state: any, source: any, length: number) {
    const tempValues = [];
    let tempCount = 0;
    const series = Series.from(source);
    for (let i = 1; i <= length; i++) {
        const rawV = series.get(i);
        const v = rawV === undefined || rawV === null ? NaN : Number(rawV);
        if (Number.isFinite(v)) {
            tempValues.unshift(v);
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
