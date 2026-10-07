// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { BACKFILL_FROM_SOURCE, SortedWindow } from '../utils/windows';

/**
 * Percentile Linear Interpolation
 *
 * Calculates percentile using method of linear interpolation between the two nearest ranks.
 *
 * The window is kept sorted, so a bar costs a binary search instead of a sort. In a local block it
 * holds the values of the last `length` calls, as on TradingView.
 */
export function percentile_linear_interpolation(context: any) {
    return (source: any, _length: any, _percentage: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        const percentage = Series.from(_percentage).get(0);
        const series = Series.from(source);

        if (context.idx < length - 1) {
            return NaN;
        }

        // The `length` values in ascending order (na if one of them is na)
        let valueAt: (k: number) => number;
        if (_callId) {
            if (!context.taState) context.taState = {};
            const win: SortedWindow = (context.taState[_callId] ??= new SortedWindow((v) => isNaN(v)));
            win.begin(context.idx);
            win.push(context.idx, series.get(0), length, BACKFILL_FROM_SOURCE, source);
            if (win.size < length || win.nas() > 0) return NaN;
            valueAt = (k) => win.kth(k);
        } else {
            const values: number[] = [];
            for (let i = 0; i < length; i++) {
                const val = series.get(i);
                if (isNaN(val)) return NaN;
                values.push(val);
            }
            values.sort((a, b) => a - b);
            valueAt = (k) => values[k];
        }

        // Formula inferred from test data: index = (percentage / 100) * length - 0.5
        let index = (percentage / 100) * length - 0.5;

        if (index < 0) index = 0;
        if (index > length - 1) index = length - 1;

        const lowerIndex = Math.floor(index);
        const upperIndex = Math.ceil(index);

        if (lowerIndex === upperIndex) {
            return context.precision(valueAt(lowerIndex));
        }

        const fraction = index - lowerIndex;
        const lower = valueAt(lowerIndex);
        const result = lower + fraction * (valueAt(upperIndex) - lower);

        return context.precision(result);
    };
}
