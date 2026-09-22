// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Lowest Bars
 *
 * Returns the offset to the lowest value over a given length.
 * Formula: Offset to the lowest bar (negative value).
 */
export function lowestbars(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        const series = Series.from(source);

        // Stateless calculation (accesses past data via Series)
        
        if (context.idx < length - 1) {
            return NaN;
        }

        let minVal = Infinity;
        let minOffset = NaN;

        for (let i = 0; i < length; i++) {
            const val = series.get(i);
            
            if (isNaN(val)) continue;

            // `<=` so that, scanning newest → oldest, an older bar with the same value
            // overwrites: TradingView returns the offset of the OLDEST bar among ties.
            if (isNaN(minOffset) || val <= minVal) {
                minVal = val;
                minOffset = -i;
            }
        }

        return minOffset;
    };
}
