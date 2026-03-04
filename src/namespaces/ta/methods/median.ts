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
                prevCallCount: 0,
                // Tentative state
                currentWindow: [],
                currentCallCount: 0
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

        const window = [...state.prevWindow];
        window.unshift(currentValue);

        while (window.length > length) {
            window.pop();
        }

        // Track actual call count for callsite-correct backfill
        const callCount = state.prevCallCount + 1;
        if (window.length < length && (callCount >= length || context.idx >= length - 1)) {
            const series = Series.from(source);
            while (window.length < length) {
                window.push(series.get(window.length));
            }
        }

        state.currentWindow = window;
        state.currentCallCount = callCount;

        if (window.length < length) {
            return NaN;
        }

        const sorted = window.slice().sort((a, b) => a - b);
        const mid = Math.floor(length / 2);
        const median = length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

        return context.precision(median);
    };
}
