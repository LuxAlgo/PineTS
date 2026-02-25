// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function linreg(context: any) {
    return (source: any, _length: any, _offset: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        const offset = Series.from(_offset).get(0);

        // Linear Regression
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `linreg_${length}_${offset}`;

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

        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumXX = 0;
        const n = length;

        // Calculate regression coefficients
        // window[0] is most recent (x = length - 1), window[length-1] is oldest (x = 0)
        for (let j = 0; j < length; j++) {
            const x = length - 1 - j; // Most recent bar has highest x value
            const y = window[j];
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumXX += x * x;
        }

        const denominator = n * sumXX - sumX * sumX;
        if (denominator === 0) {
            return NaN;
        }

        const slope = (n * sumXY - sumX * sumY) / denominator;
        const intercept = (sumY - slope * sumX) / n;

        // Pine formula: intercept + slope * (length - 1 - offset)
        const linRegValue = intercept + slope * (length - 1 - offset);

        return context.precision(linRegValue);
    };
}
