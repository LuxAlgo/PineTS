// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { nonNaWindow } from '../utils/nonNaWindow';

/**
 * Mode
 *
 * Returns the mode of the series. If there are several values with the same frequency, returns the smallest value.
 *
 * As on TradingView, over the last `length` non-na values (na values are skipped, like `ta.median`);
 * in a local block, the values of the calls.
 */
export function mode(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        const series = Series.from(source);

        const window = nonNaWindow(context, _callId || `mode_${length}`, series, length, 'counts');
        return window && context.idx >= length - 1 ? window.mode() : NaN;
    };
}
