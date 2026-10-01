// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Percent Rank
 *
 * Returns the percentage of values in the last length previous bars that are less than or equal to the current value.
 */
export function percentrank(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        const series = Series.from(source);

        if (context.idx < length) {
            return NaN;
        }

        const currentValue = series.get(0);

        // As on TradingView, an na value (current or previous) compares false, so it is not counted,
        // and the count is always divided by `length`: an na bar returns 0.
        let count = 0;
        if (currentValue !== null && currentValue !== undefined) {
            for (let i = 1; i <= length; i++) {
                const val = series.get(i);
                if (val !== null && val !== undefined && val <= currentValue) count++;
            }
        }

        return context.precision((count / length) * 100);
    };
}
