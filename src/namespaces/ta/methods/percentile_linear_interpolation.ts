// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { validLength } from '../utils/barRing';
import { linearInterpolation, PercentileArray } from '../utils/percentileArray';

/**
 * Percentile Linear Interpolation
 *
 * Calculates percentile using method of linear interpolation between the two nearest ranks.
 *
 * The values are kept in TradingView's order (PercentileArray: ascending without na), so a bar costs
 * a binary search instead of a sort. In a local block they are the values of the last `length` calls,
 * as on TradingView.
 */
export function percentile_linear_interpolation(context: any) {
    return (source: any, _length: any, _percentage: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        const percentage = Series.from(_percentage).get(0);
        const series = Series.from(source);

        if (context.idx < length - 1 || !validLength(length)) {
            return NaN;
        }

        if (!context.taState) context.taState = {};
        const key = _callId || `pli_${length}_${percentage}`;
        const win: PercentileArray = (context.taState[key] ??= new PercentileArray());
        const values = win.step(context.idx, series.get(0), length, series);
        if (!values) return NaN;

        // index = (percentage / 100) * length - 0.5, interpolated with the next value
        return context.precision(linearInterpolation(values, percentage));
    };
}
