// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function highest(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        if (typeof _length === 'string' && _callId === undefined) {
            _callId = _length;
            _length = source;
            source = context.data.high;
        }

        const length = Series.from(_length).get(0);
        if (length <= 0) return NaN;

        if (!context.taState) context.taState = {};
        const stateKey = _callId ? `${_callId}_${length}` : `highest_${length}`;
        const callsiteKey = _callId ? `highest_callsite_${_callId}` : 'highest_callsite';
        const callsite = context.taState[callsiteKey];
        const isContinuousCall = callsite?.lastIdx === context.idx - 1;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: -1,
                prevWindow: [],
                prevCallCount: 0,
                currentWindow: [],
                currentCallCount: 0,
            };
            if (isContinuousCall) {
                seedWindow(context.taState[stateKey], source, length);
            }
        }

        const state = context.taState[stateKey];
        if (context.idx > state.lastIdx + 1 && isContinuousCall) {
            seedWindow(state, source, length);
            state.lastIdx = context.idx;
        }
        if (context.idx > state.lastIdx) {
            if (state.lastIdx >= 0) {
                state.prevWindow = [...state.currentWindow];
                state.prevCallCount = state.currentCallCount;
            }
            state.lastIdx = context.idx;
        }

        const window = [...state.prevWindow];
        window.unshift(Series.from(source).get(0));
        while (window.length > length) window.pop();

        const callCount = state.prevCallCount + 1;
        if (window.length < length && (callCount >= length || context.idx >= length - 1)) {
            const series = Series.from(source);
            while (window.length < length) window.push(series.get(window.length));
        }

        state.currentWindow = window;
        state.currentCallCount = callCount;
        context.taState[callsiteKey] = { lastIdx: context.idx };

        if (window.length < length) return NaN;
        let highestValue = -Infinity;
        let hasValue = false;
        for (const value of window) {
            if (value !== undefined && value !== null && !Number.isNaN(value)) {
                highestValue = Math.max(highestValue, value);
                hasValue = true;
            }
        }
        return hasValue ? context.precision(highestValue) : NaN;
    };
}

function seedWindow(state: any, source: any, length: number) {
    const series = Series.from(source);
    state.prevWindow = [];
    state.currentWindow = [];
    state.prevCallCount = 0;
    state.currentCallCount = 0;
    for (let offset = 1; offset < length; offset += 1) {
        const value = series.get(offset);
        if (value === undefined || value === null) break;
        state.prevWindow.push(value);
    }
    state.prevCallCount = state.prevWindow.length;
}
