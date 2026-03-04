// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function highest(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        // if the _length is of type string, this is probably the _callId
        // ==> this is a weak approach to determine syntaxes : ta.highest(length) vs ta.highest(source, length)
        if (typeof _length === 'string' && _callId === undefined) {
            _callId = _length
            _length = source
            source = context.data.high;
        }

        const length = Series.from(_length).get(0);

        // Rolling maximum
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `highest_${length}`;

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

        // Backfill from source series when the window is undersized.
        // Use both callCount (for top-level calls) and context.idx
        // (for conditional blocks where callCount < length but enough
        // chart bars exist to look back through the source series).
        if (window.length < length && (callCount >= length || context.idx >= length - 1)) {
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
        if (validValues.length === 0) {
            return NaN;
        }

        const max = Math.max(...validValues);
        return context.precision(max);
    };
}
