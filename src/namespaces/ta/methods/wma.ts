// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function wma(context: any) {
    return (source: any, _period: any, _callId?: string) => {
        const period = Series.from(_period).get(0);
        if (period <= 0) return NaN;

        // Incremental WMA calculation using circular buffer
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `wma_${period}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: context.idx - 1,
                committedValues: new Array(period),
                committedHead: 0,
                committedCount: 0,
                values: new Array(period),
                head: 0,
                count: 0,
                currentResult: NaN,
            };
            if (context.idx > 0) {
                rebuildRollingWma(context.taState[stateKey], source, period);
                context.taState[stateKey].lastIdx = context.idx;
            }
        }

        const state = context.taState[stateKey];

        // Handle gap/conditional execution: rebuild from series if we skipped bars
        if (context.idx > state.lastIdx + 1) {
            rebuildRollingWma(state, source, period);
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

        if (state.count < period) {
            state.values[state.count] = value;
            state.count += 1;
        } else {
            state.values[state.head] = value;
            state.head += 1;
            if (state.head === period) state.head = 0;
        }

        if (state.count < period) {
            state.currentResult = NaN;
            return NaN;
        }

        let hasNaN = false;
        let numerator = 0;
        let denominator = 0;

        const lastInserted = (state.head - 1 + period) % period;
        for (let j = 0; j < period; j++) {
            const idx = (lastInserted - j + period) % period;
            const v = state.values[idx];
            if (v === undefined || v === null || Number.isNaN(v)) {
                hasNaN = true;
                break;
            }
            const weight = period - j;
            numerator += v * weight;
            denominator += weight;
        }

        state.currentResult = hasNaN ? NaN : context.precision(numerator / denominator);
        return state.currentResult;
    };
}

function rebuildRollingWma(state: any, source: any, period: number) {
    const tempValues = [];
    let tempCount = 0;
    const series = Series.from(source);
    for (let i = 1; i <= period; i++) {
        const rawV = series.get(i);
        const v = rawV === undefined || rawV === null ? NaN : Number(rawV);
        if (Number.isFinite(v)) {
            tempValues.unshift(v); // oldest to newest
            tempCount++;
        } else {
            break;
        }
    }
    state.committedValues = new Array(period);
    for (let i = 0; i < tempCount; i++) {
        state.committedValues[i] = tempValues[i];
    }
    state.committedHead = 0;
    state.committedCount = tempCount;
}
