// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { CarryHistory } from '../utils/history';

// TradingView weighs an na bar with the last non-na value before it (and returns na on the na bar
// itself), so the history holds the source with na values filled forward.
const fillForward = (x: number, prev: number) => (Number.isNaN(x) ? prev : x);

export function wma(context: any) {
    return (source: any, _period: any, _callId?: string) => {
        const period = Series.from(_period).get(0);
        if (!(period >= 1)) return NaN;

        // Weighted Moving Average over the last `period` bars (in a local block, a skipped bar repeating
        // the last call's value); O(1) for any period (prefix sums)
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `wma_${period}`;
        const carry: CarryHistory = (context.taState[stateKey] ??= new CarryHistory(2, fillForward));
        const series = Series.from(source);
        const currentValue = series.get(0);
        carry.push(context.idx, currentValue, period, series);

        if (currentValue === null || currentValue === undefined || Number.isNaN(currentValue)) return NaN;
        const h = carry.h;
        if (h.size < period || h.nas(period) > 0) return NaN;
        return context.precision(h.wsum(period) / ((period * (period + 1)) / 2));
    };
}
