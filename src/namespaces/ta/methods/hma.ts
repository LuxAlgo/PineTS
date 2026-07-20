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
                // Circular buffer committed state
                committedValues: new Array(sqrtPeriod),
                committedHead: 0,
                committedCount: 0,
                // Circular buffer tentative state
                values: new Array(sqrtPeriod),
                head: 0,
                count: 0,
                currentResult: NaN,
            };
            if (context.idx > 0) {
                rebuildRollingHma(context.taState[stateKey], source, halfPeriod, period, sqrtPeriod);
                context.taState[stateKey].lastIdx = context.idx;
            }
        }

        const state = context.taState[stateKey];

        // Handle gap/conditional execution: rebuild from series if we skipped bars
        if (context.idx > state.lastIdx + 1) {
            rebuildRollingHma(state, source, halfPeriod, period, sqrtPeriod);
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

        let numerator = 0;
        let denominator = 0;
        let hasNaN = false;

        const lastInserted = (state.head - 1 + sqrtPeriod) % sqrtPeriod;
        for (let j = 0; j < sqrtPeriod; j++) {
            const idx = (lastInserted - j + sqrtPeriod) % sqrtPeriod;
            const v = state.values[idx];
            if (v === undefined || v === null || Number.isNaN(v)) {
                hasNaN = true;
                break;
            }
            const weight = sqrtPeriod - j;
            numerator += v * weight;
            denominator += weight;
        }

        if (hasNaN) {
            state.currentResult = NaN;
            return NaN;
        }

        const hma = numerator / denominator;
        state.currentResult = context.precision(hma);
        return state.currentResult;
    };
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
    const tempValues = [];
    let tempCount = 0;
    for (let i = 1; i <= sqrtPeriod; i++) {
        const v = getRawHmaAt(source, i, halfPeriod, period);
        if (Number.isFinite(v)) {
            tempValues.unshift(v); // oldest to newest
            tempCount++;
        } else {
            break;
        }
    }
    state.committedValues = new Array(sqrtPeriod);
    for (let i = 0; i < tempCount; i++) {
        state.committedValues[i] = tempValues[i];
    }
    state.committedHead = 0;
    state.committedCount = tempCount;
}
