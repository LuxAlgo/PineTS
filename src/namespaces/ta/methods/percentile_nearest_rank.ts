// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { validLength } from '../utils/barRing';
import { nearestRank, PercentileArray } from '../utils/percentileArray';

/**
 * Percentile Nearest Rank
 *
 * Calculates percentile using method of Nearest Rank.
 * A percentile calculated using the Nearest Rank method will always be a member of the input data set.
 *
 * The values are kept in TradingView's order (PercentileArray: ascending without na), so a bar costs
 * a binary search instead of a sort. In a local block they are the values of the last `length` calls,
 * as on TradingView.
 */
export function percentile_nearest_rank(context: any) {
    return (source: any, _length: any, _percentage: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        const percentage = Series.from(_percentage).get(0);
        const series = Series.from(source);

        if (!validLength(length)) {
            return NaN;
        }

        if (!context.taState) context.taState = {};
        const key = _callId || `pnr_${length}_${percentage}`;
        const win: PercentileArray = (context.taState[key] ??= new PercentileArray());
        const values = win.step(context.idx, series.get(0), length, series);
        if (!values || context.idx < length - 1) return NaN;

        // Nearest Rank: index = ceil(P/100 * N) - 1
        return context.precision(nearestRank(values, percentage));
    };
}
