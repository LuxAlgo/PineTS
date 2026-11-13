// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { crossPair } from '../utils/naAware';

/**
 * Cross Detection
 *
 * Detects when two series cross each other (either direction).
 * Returns true if series1 crosses series2 (either above or below).
 *
 * Formula (as TradingView evaluates it):
 * cross = (source1[0] > source2[0]) != (source1[1] > source2[1])
 *
 * @param source1 - First data series
 * @param source2 - Second data series
 * @returns true if the series have crossed, false otherwise
 */
export function cross(context: any) {
    return (source1: any, source2: any, _callId?: string) => {
        // The previous values come from the most recent earlier bar where both were non-na.
        const [current1, current2, prev1, prev2] = crossPair(context, _callId, Series.from(source1), Series.from(source2));

        // If any value is NaN, return false
        if (isNaN(current1) || isNaN(current2) || isNaN(prev1) || isNaN(prev2)) {
            return false;
        }

        // TradingView reports a change of `source1 > source2`, which is not crossover || crossunder:
        // 3 -> 4 against 3 crosses, but 3 -> 2 against 3 does not (crossunder alone fires).
        return current1 > current2 !== prev1 > prev2;
    };
}
