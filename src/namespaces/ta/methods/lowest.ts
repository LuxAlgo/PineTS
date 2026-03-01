// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function lowest(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        // if the _length is of type string, this is probably the _callId 
        // ==> this is a weak approach to determine syntaxes : ta.low(length) vs ta.low(source, length)
        if (typeof _length === 'string' && _callId === undefined) {
            _callId = _length
            _length = source
            source = context.data.low;
        }

        const length = Series.from(_length).get(0);

        // Rolling minimum
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `lowest_${length}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: -1,
                // Committed state
                prevWindow: [],
                prevCallCount: 0,
                // Tentative state
                currentWindow: [],
                currentCallCount: 0,
            };
        }

        const state = context.taState[stateKey];

        // Commit logic
        if (context.idx > state.lastIdx) {
            if (state.lastIdx >= 0) {
                state.prevWindow = [...state.currentWindow];
                state.prevCallCount = state.currentCallCount;
            }
            state.lastIdx = context.idx;
        }

        const currentValue = Series.from(source).get(0);

        // Use committed state
        const window = [...state.prevWindow];

        window.unshift(currentValue);

        while (window.length > length) {
            window.pop();
        }

        // Track actual call count for callsite-correct backfill
        const callCount = state.prevCallCount + 1;
        if (window.length < length && callCount >= length) {
            const series = Series.from(source);
            while (window.length < length) {
                window.push(series.get(window.length));
            }
        }

        // Update tentative state
        state.currentWindow = window;
        state.currentCallCount = callCount;

        if (window.length < length) {
            return NaN;
        }

        const validValues = window.filter((v) => !isNaN(v) && v !== undefined);
        const min = validValues.length > 0 ? Math.min(...validValues) : NaN;
        return context.precision(min);
    };
}
