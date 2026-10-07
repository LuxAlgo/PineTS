// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { nonNaWindow } from '../utils/nonNaWindow';

export function median(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        const series = Series.from(source);

        // Median of the last `length` non-na values (na values are skipped, as on TradingView).
        const window = nonNaWindow(context, _callId || `median_${length}`, series, length, 'sorted');
        if (!window) return NaN;

        const mid = Math.floor(length / 2);
        const median = length % 2 === 0 ? (window.kth(mid - 1) + window.kth(mid)) / 2 : window.kth(mid);

        return context.precision(median);
    };
}
