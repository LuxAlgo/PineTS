// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function wma(context: any) {
    return (source: any, _period: any, _callId?: string) => {
        const period = Series.from(_period).get(0);

        // Weighted Moving Average
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `wma_${period}`;

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
        const currentIsNa = currentValue === null || currentValue === undefined || Number.isNaN(currentValue);

        // Use committed state
        const window = [...state.prevWindow];

        // TradingView weighs an na bar with the last non-na value before it (and returns na on the
        // na bar itself), so the window holds the source with na values filled forward.
        window.unshift(currentIsNa ? (window.length ? window[0] : NaN) : currentValue);

        while (window.length > period) {
            window.pop();
        }

        // Track actual call count for callsite-correct backfill
        const callCount = state.prevCallCount + 1;
        if (window.length < period && (callCount >= period || context.idx >= period - 1)) {
            const series = Series.from(source);
            while (window.length < period) {
                window.push(series.get(window.length));
            }
            for (let i = window.length - 2; i >= 0; i--) {
                if (Number.isNaN(window[i])) window[i] = window[i + 1];
            }
        }

        // Update tentative state
        state.currentWindow = window;
        state.currentCallCount = callCount;

        if (window.length < period || currentIsNa || window.some((v) => Number.isNaN(v))) {
            return NaN;
        }

        let numerator = 0;
        let denominator = 0;
        for (let i = 0; i < period; i++) {
            const weight = period - i;
            numerator += window[i] * weight;
            denominator += weight;
        }

        const wma = numerator / denominator;
        return context.precision(wma);
    };
}
