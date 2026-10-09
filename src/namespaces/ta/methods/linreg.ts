// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { LinregCall } from '../utils/barRing';

export function linreg(context: any) {
    return (source: any, _length: any, _offset: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        const offset = Series.from(_offset).get(0);

        // Linear Regression over the window as TradingView reads it (in a local block, bars the block
        // skipped are read from slots written earlier, or repeat the last call's value: LinregCall)
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `linreg_${length}_${offset}`;
        if (!context.taState[stateKey]) context.taState[stateKey] = new LinregCall();
        const win: LinregCall = context.taState[stateKey];
        const series = Series.from(source);
        const sums = win.step(context.idx, series.get(0), length, series);
        if (!sums) return NaN;

        // x = 0 for the oldest bar ... length - 1 for the current one, so Σx·y = N - S where N weighs the
        // current value with `length` and the oldest with 1.
        const n = length;
        const sumX = (n * (n - 1)) / 2;
        const sumXX = ((n - 1) * n * (2 * n - 1)) / 6;
        const sumY = sums[0];
        const sumXY = sums[1] - sums[0];

        const denominator = n * sumXX - sumX * sumX;
        // A single value has no regression line: TradingView keeps the last call's slope and intercept
        // (the intercept being that line's value on the oldest bar of its window).
        if (denominator === 0) {
            if (!win.line) return NaN;
            return context.precision(win.line[1] + win.line[0] * (length - 1 - offset));
        }

        const slope = (n * sumXY - sumX * sumY) / denominator;
        const intercept = (sumY - slope * sumX) / n;
        win.line = [slope, intercept];

        // Pine formula: intercept + slope * (length - 1 - offset)
        const linRegValue = intercept + slope * (length - 1 - offset);

        return context.precision(linRegValue);
    };
}
