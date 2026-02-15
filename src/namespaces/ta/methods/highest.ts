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

        if (window.length < length) {
            // Update tentative state
            state.currentWindow = window;
            return NaN;
        }

        if (window.length > length) {
            window.pop();
        }

        // Update tentative state
        state.currentWindow = window;

        const validValues = window.filter((v) => !isNaN(v) && v !== undefined);
        if (validValues.length === 0) {
            return NaN;
        }

        const max = Math.max(...validValues);
        return context.precision(max);
    };
}
