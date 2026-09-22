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

            // TradingView resets the window at na: only the bars since the most recent
            // na take part, and an na on the current bar yields offset 0
            // (tests/namespaces/ta/na-window-semantics.test.ts).
            if (val === undefined || isNaN(val)) break;

            if (isNaN(maxOffset) || val > maxVal) {
                maxVal = val;
                maxOffset = -i;
            }
        }

        return isNaN(maxOffset) ? 0 : maxOffset;
    };
}
