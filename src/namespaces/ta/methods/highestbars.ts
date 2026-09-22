// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Highest Bars
 *
 * Returns the offset to the highest value over a given length.
 * Formula: Offset to the highest bar (negative value).
 */
export function highestbars(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        const series = Series.from(source);

        // Stateless calculation (accesses past data via Series),
        // but result depends on historical data availability.

        if (context.idx < length - 1) {
            return NaN;
        }

        let maxVal = -Infinity;
        let maxOffset = NaN;

        for (let i = 0; i < length; i++) {
            const val = series.get(i);

            if (isNaN(val)) continue;

            // `>=` so that, scanning newest → oldest, an older bar with the same value
            // overwrites: TradingView returns the offset of the OLDEST bar among ties.
            if (isNaN(maxOffset) || val >= maxVal) {
                maxVal = val;
                maxOffset = -i;
            }
        }

        return maxOffset;
    };
}
