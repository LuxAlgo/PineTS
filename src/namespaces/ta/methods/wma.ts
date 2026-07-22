// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Weighted Moving Average (WMA)
 *
 * Formula:
 * - WMA = Sum(source * weight, length) / Sum(weights, length)
 *
 * @param source - Source series
 * @param period - Period of WMA
 * @returns WMA value
 */
export function wma(context: any) {
    return (source: any, _period: any, _callId?: string) => {
        const period = Series.from(_period).get(0);
        if (period <= 0) return NaN;

        if (!context.taState) context.taState = {};
        const stateKey = _callId ? `${_callId}_${period}` : `wma_${period}`;

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
                sum: 0,
                weightedSum: 0,
                nanCount: 0,
                rollbackSum: 0,
                rollbackWeightedSum: 0,
                rollbackNaNCount: 0,
                currentResult: NaN,
            };
            if (context.idx > 0) rebuildRollingWma(context.taState[stateKey], source, period);
        }

        const state = context.taState[stateKey];
        if (context.idx > state.lastIdx + 1) rebuildRollingWma(state, source, period);

        if (context.idx > state.lastIdx) {
            state.rollbackHead = state.head;
            state.rollbackCount = state.count;
            state.rollbackIndex = state.count < period ? state.count : state.head;
            state.rollbackValue = state.values[state.rollbackIndex];
            state.rollbackSum = state.sum;
            state.rollbackWeightedSum = state.weightedSum;
            state.rollbackNaNCount = state.nanCount;
            state.lastIdx = context.idx;
        } else {
            state.head = state.rollbackHead;
            state.count = state.rollbackCount;
            state.values[state.rollbackIndex] = state.rollbackValue;
            state.sum = state.rollbackSum;
            state.weightedSum = state.rollbackWeightedSum;
            state.nanCount = state.rollbackNaNCount;
        }

        const currentValue = Series.from(source).get(0);
        const value = currentValue === undefined || currentValue === null ? NaN : Number(currentValue);
        if (state.count < period) {
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
            if (state.head === period) state.head = 0;
        }

        if (Number.isNaN(value)) {
            state.nanCount += 1;
        } else {
            state.sum += value;
        }

        if (state.count < period || state.nanCount > 0) {
            state.currentResult = NaN;
            return NaN;
        }

        state.weightedSum = weightedSum(state.values, state.head, period);

        const denominator = (period * (period + 1)) / 2;
        state.currentResult = context.precision(state.weightedSum / denominator);
        return state.currentResult;
    };
}

function weightedSum(values: readonly number[], head: number, length: number) {
    let result = 0;
    let weight = length;
    for (let index = head - 1; index >= 0; index -= 1) {
        result += values[index] * weight;
        weight -= 1;
    }
    for (let index = length - 1; index >= head; index -= 1) {
        result += values[index] * weight;
        weight -= 1;
    }
    return result;
}

function rebuildRollingWma(state: any, source: any, period: number) {
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
    state.sum = values.reduce((sum: number, value: number) => sum + value, 0);
    state.weightedSum = state.count === period ? weightedSum(state.values, state.head, period) : 0;
    state.nanCount = 0;
}
