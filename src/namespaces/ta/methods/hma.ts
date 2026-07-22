// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Hull Moving Average (HMA)
 *
 * Formula:
 * - HMA = WMA(2*WMA(n/2) - WMA(n), sqrt(n))
 *
 * @param source - Source series
 * @param period - Period of HMA
 * @returns HMA value
 */
export function hma(context: any) {
    return (source: any, _period: any, _callId?: string) => {
        const period = Series.from(_period).get(0);
        if (period <= 0) return NaN;

        // Hull Moving Average: HMA = WMA(2*WMA(n/2) - WMA(n), sqrt(n))
        const halfPeriod = Math.floor(period / 2);
        const sqrtPeriod = Math.floor(Math.sqrt(period));

        const wmaFn = context.pine.ta.wma;

        // Pass derived call IDs to internal WMA calls to avoid state collision
        const wma1 = wmaFn(source, halfPeriod, _callId ? `${_callId}_wma1` : undefined);
        const wma2 = wmaFn(source, period, _callId ? `${_callId}_wma2` : undefined);

        if (isNaN(wma1) || isNaN(wma2)) {
            return NaN;
        }

        const rawHma = 2 * wma1 - wma2;

        if (!context.taState) context.taState = {};
        const stateKey = _callId ? `${_callId}_${period}` : `hma_raw_${period}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: context.idx - 1,
                values: new Array(sqrtPeriod),
                head: 0,
                count: 0,
                rollbackHead: 0,
                rollbackCount: 0,
                rollbackIndex: 0,
                rollbackValue: undefined,
                currentResult: NaN,
            };
            if (context.idx > 0) {
                rebuildRollingHma(context.taState[stateKey], source, halfPeriod, period, sqrtPeriod);
            }
        }

        const state = context.taState[stateKey];

        if (context.idx > state.lastIdx + 1) {
            rebuildRollingHma(state, source, halfPeriod, period, sqrtPeriod);
        }

        if (context.idx > state.lastIdx) {
            state.rollbackHead = state.head;
            state.rollbackCount = state.count;
            state.rollbackIndex = state.count < sqrtPeriod ? state.count : state.head;
            state.rollbackValue = state.values[state.rollbackIndex];
            state.lastIdx = context.idx;
        } else {
            state.head = state.rollbackHead;
            state.count = state.rollbackCount;
            state.values[state.rollbackIndex] = state.rollbackValue;
        }

        const value = Number.isFinite(rawHma) ? rawHma : NaN;

        if (state.count < sqrtPeriod) {
            state.values[state.count] = value;
            state.count += 1;
        } else {
            state.values[state.head] = value;
            state.head += 1;
            if (state.head === sqrtPeriod) state.head = 0;
        }

        if (state.count < sqrtPeriod) {
            state.currentResult = NaN;
            return NaN;
        }

        const hma = weightedSum(state.values, state.head, sqrtPeriod) / ((sqrtPeriod * (sqrtPeriod + 1)) / 2);
        state.currentResult = context.precision(hma);
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

function getWmaAt(source: any, idx: number, period: number) {
    const series = Series.from(source);
    let numerator = 0;
    let denominator = 0;
    for (let j = 0; j < period; j++) {
        const val = series.get(idx + j);
        if (val === null || val === undefined || Number.isNaN(val)) {
            return NaN;
        }
        const weight = period - j;
        numerator += val * weight;
        denominator += weight;
    }
    return numerator / denominator;
}

function getRawHmaAt(source: any, idx: number, halfPeriod: number, period: number) {
    const wma1 = getWmaAt(source, idx, halfPeriod);
    const wma2 = getWmaAt(source, idx, period);
    if (Number.isNaN(wma1) || Number.isNaN(wma2)) return NaN;
    return 2 * wma1 - wma2;
}

function rebuildRollingHma(state: any, source: any, halfPeriod: number, period: number, sqrtPeriod: number) {
    const values = [];
    for (let i = 1; i <= sqrtPeriod; i++) {
        const v = getRawHmaAt(source, i, halfPeriod, period);
        if (Number.isFinite(v)) {
            values.unshift(v);
        } else {
            break;
        }
    }
    state.values = new Array(sqrtPeriod);
    for (let index = 0; index < values.length; index += 1) state.values[index] = values[index];
    state.head = 0;
    state.count = values.length;
}
