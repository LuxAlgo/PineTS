// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function highest(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        // if the _length is of type string, this is probably the _callId
        // ==> this is a weak approach to determine syntaxes : ta.highest(length) vs ta.highest(source, length)
        if (typeof _length === 'string' && _callId === undefined) {
            _callId = _length;
            _length = source;
            source = context.data.high;
        }

        const length = Series.from(_length).get(0);
        if (length <= 0) return NaN;

        if (!context.taState) context.taState = {};
        const stateKey = _callId ? `${_callId}_${length}` : `highest_${length}`;

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
                rebuildRollingHighest(context.taState[stateKey], source, length);
                context.taState[stateKey].lastIdx = context.idx;
            }
        }

        const state = context.taState[stateKey];

        if (context.idx > state.lastIdx + 1) {
            rebuildRollingHighest(state, source, length);
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

        let max = -Infinity;
        let hasValid = false;
        for (let i = 0; i < length; i++) {
            const v = state.values[i];
            if (v !== undefined && v !== null && !Number.isNaN(v)) {
                if (v > max) {
                    max = v;
                }
                hasValid = true;
            }
        }

        state.currentResult = hasValid ? context.precision(max) : NaN;
        return state.currentResult;
    };
}

function rebuildRollingHighest(state: any, source: any, length: number) {
    const tempValues = [];
    const series = Series.from(source);
    for (let i = 1; i <= length; i++) {
        const rawV = series.get(i);
        const v = rawV === undefined || rawV === null ? NaN : Number(rawV);
        tempValues.unshift(v);
    }
    state.committedValues = new Array(length);
    for (let i = 0; i < length; i++) {
        state.committedValues[i] = tempValues[i];
    }
    state.committedHead = 0;
    state.committedCount = length;
}
