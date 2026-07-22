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

        if (!context.taState) context.taState = {};
        const stateKey = _callId ? `${_callId}_${length}` : `cci_${length}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: context.idx - 1,
                values: new Array(length),
                head: 0,
                count: 0,
                callCount: 0,
                rollbackHead: 0,
                rollbackCount: 0,
                rollbackCallCount: 0,
                rollbackIndex: 0,
                rollbackValue: undefined,
                currentResult: NaN,
            };
            if (context.idx > 0) rebuildRollingCci(context.taState[stateKey], source, length);
        }

        const state = context.taState[stateKey];
        if (context.idx > state.lastIdx + 1) rebuildRollingCci(state, source, length);

        if (context.idx > state.lastIdx) {
            state.rollbackHead = state.head;
            state.rollbackCount = state.count;
            state.rollbackCallCount = state.callCount;
            state.rollbackIndex = state.count < length ? state.count : state.head;
            state.rollbackValue = state.values[state.rollbackIndex];
            state.lastIdx = context.idx;
        } else {
            state.head = state.rollbackHead;
            state.count = state.rollbackCount;
            state.callCount = state.rollbackCallCount;
            state.values[state.rollbackIndex] = state.rollbackValue;
        }

        const currentValue = Series.from(source).get(0);
        const value = currentValue === undefined || currentValue === null ? NaN : Number(currentValue);
        if (Number.isNaN(value)) {
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

        if (state.count < length && (state.callCount >= length || context.idx >= length - 1)) {
            const series = Series.from(source);
            while (state.count < length) {
                const backfilled = Number(series.get(state.count));
                if (Number.isNaN(backfilled)) break;
                state.values[state.count] = backfilled;
                state.count += 1;
            }
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

        const sma = sum / length;
        let sumAbsoluteDeviations = 0;
        for (let index = state.head - 1; index >= 0; index -= 1) {
            sumAbsoluteDeviations += Math.abs(state.values[index] - sma);
        }
        for (let index = length - 1; index >= state.head; index -= 1) {
            sumAbsoluteDeviations += Math.abs(state.values[index] - sma);
        }
        const meanDeviation = sumAbsoluteDeviations / length;
        if (meanDeviation === 0) {
            state.currentResult = 0;
            return 0;
        }

        state.currentResult = context.precision((value - sma) / (0.015 * meanDeviation));
        return state.currentResult;
    };
}

function rebuildRollingCci(state: any, source: any, length: number) {
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
    state.callCount = values.length;
}
