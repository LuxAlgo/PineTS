// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function median(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);

        // Rolling median
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `median_${length}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = { 
                lastIdx: -1,
                // Committed state
                prevWindow: [],
                // Tentative state
                currentWindow: []
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

        state.currentWindow = window;

        if (window.length < length) {
            return NaN;
        }

        const sorted = window.slice().sort((a, b) => a - b);
        const mid = Math.floor(length / 2);
        const median = length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

        return context.precision(median);
    };
}
