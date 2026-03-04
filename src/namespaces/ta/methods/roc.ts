// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function roc(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);

        // ROC = ((current - previous) / previous) * 100
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `roc_${length}`;

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

        // Use committed state as base
        const window = [...state.prevWindow];

        window.unshift(currentValue);

        while (window.length > length + 1) {
            window.pop();
        }

        // Track actual call count for callsite-correct backfill
        const callCount = state.prevCallCount + 1;
        if (window.length < length + 1 && (callCount >= length + 1 || context.idx >= length)) {
            const series = Series.from(source);
            while (window.length < length + 1) {
                window.push(series.get(window.length));
            }
        }

        // Update tentative state
        state.currentWindow = window;
        state.currentCallCount = callCount;

        if (window.length <= length) {
            return NaN;
        }

        const prevValue = window[length];
        const roc = ((currentValue - prevValue) / prevValue) * 100;
        return context.precision(roc);
    };
}
