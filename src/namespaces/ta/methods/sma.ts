// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Simple Moving Average (SMA)
 *
 * Formula:
 * - SMA = Sum(source, length) / length
 *
 * @param source - Source series
 * @param length - Length of SMA
 * @returns SMA value
 */
export function sma(context: any) {
    return (source: any, _period: any, _callId?: string) => {
        const period = Series.from(_period).get(0);
        if (period <= 0) return NaN;

        if (!context.taState) context.taState = {};
        const stateKey = _callId ? `${_callId}_${period}` : `sma_${period}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: context.idx - 1,
                values: new Array(period),
                head: 0,
                count: 0,
                rollbackHead: 0,
                rollbackCount: 0,
                rollbackIndex: 0,
                rollbackValue: undefined,
                currentResult: NaN,
            };
            if (context.idx > 0) rebuildRollingSum(context.taState[stateKey], source, period);
        }

        const state = context.taState[stateKey];
        if (context.idx > state.lastIdx + 1) rebuildRollingSum(state, source, period);

        if (context.idx > state.lastIdx) {
            state.rollbackHead = state.head;
            state.rollbackCount = state.count;
            state.rollbackIndex = state.count < period ? state.count : state.head;
            state.rollbackValue = state.values[state.rollbackIndex];
            state.lastIdx = context.idx;
        } else {
            state.head = state.rollbackHead;
            state.count = state.rollbackCount;
            state.values[state.rollbackIndex] = state.rollbackValue;
        }

        const currentValue = Series.from(source).get(0);
        const value = currentValue === undefined || currentValue === null ? NaN : Number(currentValue);
        if (state.count < period) {
            state.values[state.count] = value;
            state.count += 1;
        } else {
            state.values[state.head] = value;
            state.head += 1;
            if (state.head === period) state.head = 0;
        }

        let sum = 0;
        let hasNaN = false;
        if (state.count < period) {
            for (let index = state.count - 1; index >= 0; index -= 1) {
                const bufferedValue = state.values[index];
                if (bufferedValue === undefined || bufferedValue === null || Number.isNaN(bufferedValue)) {
                    hasNaN = true;
                    break;
                }
                sum += bufferedValue;
            }
        } else {
            const newestIndex = state.head === 0 ? period - 1 : state.head - 1;
            for (let index = newestIndex; index >= 0; index -= 1) {
                const bufferedValue = state.values[index];
                if (bufferedValue === undefined || bufferedValue === null || Number.isNaN(bufferedValue)) {
                    hasNaN = true;
                    break;
                }
                sum += bufferedValue;
            }
            if (!hasNaN) {
                for (let index = period - 1; index > newestIndex; index -= 1) {
                    const bufferedValue = state.values[index];
                    if (bufferedValue === undefined || bufferedValue === null || Number.isNaN(bufferedValue)) {
                        hasNaN = true;
                        break;
                    }
                    sum += bufferedValue;
                }
            }
        }

        state.currentResult = state.count < period || hasNaN
            ? NaN
            : context.precision(sum / period);
        return state.currentResult;
    };
}

function rebuildRollingSum(state: any, source: any, period: number) {
    const values = [];
    const series = Series.from(source);
    for (let offset = 1; offset <= period; offset += 1) {
        const rawValue = series.get(offset);
        const value = rawValue === undefined || rawValue === null ? NaN : Number(rawValue);
        if (!Number.isFinite(value)) break;
        values.unshift(value);
    }
    state.values = new Array(period);
    for (let index = 0; index < values.length; index += 1) state.values[index] = values[index];
    state.head = 0;
    state.count = values.length;
}
