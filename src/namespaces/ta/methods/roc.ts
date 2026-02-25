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

        const prevValue = window[length];
        const roc = ((currentValue - prevValue) / prevValue) * 100;
        return context.precision(roc);
    };
}
