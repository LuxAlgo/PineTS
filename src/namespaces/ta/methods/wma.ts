// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { PushOptions, WeightedWindow } from '../utils/windows';

// Backfill with the source history, na values filled with the value before them
const BACKFILL_FILLED: PushOptions = {
    backfill: (window, _win, source, period) => {
        const series = Series.from(source);
        while (window.length < period) window.push(series.get(window.length));
        for (let i = window.length - 2; i >= 0; i--) {
            if (Number.isNaN(window[i])) window[i] = window[i + 1];
        }
    },
};

export function wma(context: any) {
    return (source: any, _period: any, _callId?: string) => {
        const period = Series.from(_period).get(0);

        // Weighted Moving Average
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `wma_${period}`;
        if (!context.taState[stateKey]) context.taState[stateKey] = new WeightedWindow(true);
        const win: WeightedWindow = context.taState[stateKey];
        win.begin(context.idx);

        const currentValue = Series.from(source).get(0);
        const currentIsNa = currentValue === null || currentValue === undefined || Number.isNaN(currentValue);

        // TradingView weighs an na bar with the last non-na value before it (and returns na on the
        // na bar itself), so the window holds the source with na values filled forward.
        const value = currentIsNa ? (win.ring.size ? win.ring.at(0) : NaN) : currentValue;
        win.push(context.idx, value, period, BACKFILL_FILLED, source);

        if (currentIsNa) return NaN;
        const sums = win.sums();
        if (!sums) return NaN;
        return context.precision(sums[1] / ((period * (period + 1)) / 2));
    };
}
