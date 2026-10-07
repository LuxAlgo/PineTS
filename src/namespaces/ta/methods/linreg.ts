// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { BACKFILL_FROM_SOURCE, WeightedWindow } from '../utils/windows';

export function linreg(context: any) {
    return (source: any, _length: any, _offset: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        const offset = Series.from(_offset).get(0);

        // Linear Regression
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `linreg_${length}_${offset}`;
        if (!context.taState[stateKey]) context.taState[stateKey] = new WeightedWindow();
        const win: WeightedWindow = context.taState[stateKey];
        win.begin(context.idx);

        win.push(context.idx, Series.from(source).get(0), length, BACKFILL_FROM_SOURCE, source);

        if (win.size < length) {
            return NaN;
        }
        const sums = win.sums();
        if (!sums) return NaN;

        // x = 0 for the oldest bar ... length - 1 for the current one, so Σx·y = N - S where N weighs the
        // current value with `length` and the oldest with 1.
        const n = length;
        const sumX = (n * (n - 1)) / 2;
        const sumXX = ((n - 1) * n * (2 * n - 1)) / 6;
        const sumY = sums[0];
        const sumXY = sums[1] - sums[0];

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
