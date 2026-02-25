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
                // Tentative state
                currentWindow: [],
            };
        }

        const state = context.taState[stateKey];

        // Commit logic
        if (context.idx > state.lastIdx) {
            if (state.lastIdx >= 0) {
                state.prevWindow = [...state.currentWindow];
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

        // Backfill from source if window is undersized (dynamic length recovery)
        if (window.length < length && context.idx >= length - 1) {
            const series = Series.from(source);
            while (window.length < length) {
                window.push(series.get(window.length));
            }
        }

        // Update tentative state
        state.currentWindow = window;

        if (window.length < length) {
            return NaN;
        }

        const validValues = window.filter((v) => !isNaN(v) && v !== undefined);
        const min = validValues.length > 0 ? Math.min(...validValues) : NaN;
        return context.precision(min);
    };
}
