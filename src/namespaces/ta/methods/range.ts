// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { nonNaWindow } from '../utils/nonNaWindow';

/**
 * Range
 *
 * Returns the difference between the highest and lowest values of a series over a given length.
 *
 * Not `ta.highest - ta.lowest`: TradingView's range keeps the last `length` non-na values
 * (an na bar is skipped, so the result repeats), returns na until `length` of them have
 * been seen, and starts its maximum from the smallest positive double, so a window of
 * negative values measures down from 0 (tests/namespaces/ta/range-na.test.ts).
 */
export function range(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        if (!(length >= 1)) return NaN;

        const series = Series.from(source);
        const win = nonNaWindow(context, _callId || `range_${length}`, series, length, 'extremes');
        if (!win) return NaN;

        const max = win.max();
        return context.precision((max > Number.MIN_VALUE ? max : Number.MIN_VALUE) - win.min());
    };
}
