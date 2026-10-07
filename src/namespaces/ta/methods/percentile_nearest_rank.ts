// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { BACKFILL_FROM_SOURCE, SortedWindow } from '../utils/windows';

/**
 * Percentile Nearest Rank
 *
 * Calculates percentile using method of Nearest Rank.
 * A percentile calculated using the Nearest Rank method will always be a member of the input data set.
 *
 * The window is kept sorted, so a bar costs a binary search instead of a sort. In a local block it
 * holds the values of the last `length` calls, as on TradingView.
 */
export function percentile_nearest_rank(context: any) {
    return (source: any, _length: any, _percentage: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        const percentage = Series.from(_percentage).get(0);
        const series = Series.from(source);

        if (context.idx < length - 1) {
            return NaN;
        }

        // The non-na values among the last `length`, in ascending order
        let count: number;
        let valueAt: (k: number) => number;
        if (_callId) {
            if (!context.taState) context.taState = {};
            const win: SortedWindow = (context.taState[_callId] ??= new SortedWindow((v) => isNaN(v)));
            win.begin(context.idx);
            win.push(context.idx, series.get(0), length, BACKFILL_FROM_SOURCE, source);
            count = win.size - win.nas();
            valueAt = (k) => win.kth(k);
        } else {
            const values: number[] = [];
            for (let i = 0; i < length; i++) {
                const val = series.get(i);
                if (!isNaN(val)) {
                    values.push(val);
                }
            }
            values.sort((a, b) => a - b);
            count = values.length;
            valueAt = (k) => values[k];
        }

        if (count === 0) return NaN;

        // Nearest Rank: index = ceil(P/100 * N) - 1
        let index = Math.ceil((percentage / 100) * count) - 1;

        if (index < 0) index = 0;
        if (index >= count) index = count - 1;

        return context.precision(valueAt(index));
    };
}
