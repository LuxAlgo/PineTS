// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Range
 *
 * Returns the difference between the highest and lowest values of a series over a given length.
 *
 * Not `ta.highest - ta.lowest`: TradingView's range keeps the last `length` non-na values
 * (an na bar is skipped, so the result repeats), returns na until `length` of them have
 * been seen, and starts its maximum from the smallest positive double, so a window of
 * negative values measures down from 0 (tests/namespaces/ta/range-na.test.ts).
 */
export function range(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        if (!(length >= 1)) return NaN;

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `range_${length}`;

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
                state.prevWindow = state.currentWindow;
                state.prevCallCount = state.currentCallCount;
            }
            state.lastIdx = context.idx;
        }

        const isNa = (v: any) => v === undefined || v === null || isNaN(v);
        const series = Series.from(source);

        // Non-na values, oldest → newest
        const window = [...state.prevWindow];

        // First call on a later bar (conditional block, barstate.islast): seed the window
        // from the source history, like the other window functions' backfill.
        if (state.prevCallCount === 0) {
            for (let i = 1; i <= context.idx && window.length < length; i++) {
                const v = series.get(i);
                if (!isNa(v)) window.unshift(v);
            }
        }

        const currentValue = series.get(0);
        if (!isNa(currentValue)) window.push(currentValue);
        while (window.length > length) window.shift();

        // Update tentative state
        state.currentWindow = window;
        state.currentCallCount = state.prevCallCount + 1;

        if (window.length < length) {
            return NaN;
        }

        let max = Number.MIN_VALUE;
        let min = Infinity;
        for (const v of window) {
            if (v > max) max = v;
            if (v < min) min = v;
        }
        return context.precision(max - min);
    };
}
