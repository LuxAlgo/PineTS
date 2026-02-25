// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function change(context: any) {
    return (source: any, _length: any = 1, _callId?: string) => {
        //handle the case where ta.change is called with the source only,
        // in that case the transpiler will inject the callId as a second parameter
        // so we need to extract the callId and set the length to 1
        if (typeof _length === 'string') {
            _callId = _length;
            _length = 1;
        }
        const length = Series.from(_length).get(0);

        // Simple lookback - store window
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `change_${length}`;

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

        // Use committed state as base
        const window = [...state.prevWindow];

        window.unshift(currentValue);

        while (window.length > length + 1) {
            window.pop();
        }

        // Backfill from source if window is undersized (dynamic length recovery)
        if (window.length < length + 1 && context.idx >= length) {
            const series = Series.from(source);
            while (window.length < length + 1) {
                window.push(series.get(window.length));
            }
        }

        // Update tentative state
        state.currentWindow = window;

        if (window.length <= length) {
            return NaN;
        }

        const change = currentValue - window[length];
        return context.precision(change);
    };
}
