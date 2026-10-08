// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { extremeBarsOffset } from '../utils/extremeBars';

/**
 * Lowest Bars
 *
 * Returns the offset to the lowest value over a given length.
 * Formula: Offset to the lowest bar (negative value).
 */
export function lowestbars(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        // ta.lowestbars(length): the call id lands in the length slot
        if (typeof _length === 'string' && _callId === undefined) {
            _callId = _length;
            _length = source;
            source = context.data.low;
        }
        const length = Series.from(_length).get(0);
        const series = Series.from(source);

        // TradingView resets the window at na: only the bars since the most recent
        // na take part, and an na on the current bar yields offset 0
        // (tests/namespaces/ta/na-window-semantics.test.ts). Among equal values the
        // OLDEST bar wins; in a local block the window is the calls of the last `length` bars.
        const offset = extremeBarsOffset(context, _callId, series, length, false);
        // Result depends on historical data availability.
        return context.idx < length - 1 ? NaN : offset;
    };
}
