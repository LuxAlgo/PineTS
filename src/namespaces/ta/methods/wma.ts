// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { CarryHistory } from '../utils/history';

// TradingView weighs an na bar with the last non-na value before it (and returns na on the na bar
// itself), so the history holds the source with na values filled forward.
const fillForward = (x: number, prev: number) => (Number.isNaN(x) ? prev : x);

const isNa = (v: any) => v === null || v === undefined || Number.isNaN(v);

class WmaState {
    carry: CarryHistory;
    constructor(budget?: any) {
        this.carry = new CarryHistory(2, fillForward, budget);
    }
    // non-na values seen, at the end of the previous bar and now
    savedSeen = 0;
    seen = 0;
}

export function wma(context: any) {
    return (source: any, _period: any, _callId?: string) => {
        const period = Series.from(_period).get(0);
        if (!(period >= 1)) return NaN;

        // Weighted Moving Average over the last `period` bars (in a local block, a skipped bar repeating
        // the last call's value); O(1) for any period (prefix sums)
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `wma_${period}`;
        const state: WmaState = (context.taState[stateKey] ??= new WmaState(context.executionBudget));
        const carry = state.carry;
        const series = Series.from(source);
        const currentValue = series.get(0);
        carry.push(context.idx, currentValue, period, series, context.executionBudget);

        if (carry.newBar) state.savedSeen = state.seen;
        else state.seen = state.savedSeen;
        if (!isNa(currentValue)) state.seen++;

        if (isNa(currentValue)) return NaN;
        // As on TradingView, no value until `period` non-na values have been seen, even when the filled
        // history already spans `period` bars
        const h = carry.h;
        if (state.seen < period || h.size < period || h.nas(period) > 0) return NaN;
        return context.precision(h.wsum(period) / ((period * (period + 1)) / 2));
    };
}
