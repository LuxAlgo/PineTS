// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { CallWindow, PushOptions } from '../utils/windows';

const OPTIONS: PushOptions = {
    dropped: (v, win) => {
        win.tAgg -= v;
    },
    // Backfill from source if window is undersized (dynamic length recovery)
    // Break on NaN since this function intentionally excludes NaN from the window
    backfill: (window, win, source, length) => {
        const series = Series.from(source);
        while (window.length < length) {
            const val = series.get(window.length);
            if (isNaN(val)) break;
            window.push(val);
            win.tAgg += val;
        }
    },
};

/**
 * Bollinger Bands Width (BBW)
 *
 * Formula:
 * basis = ta.sma(source, length)
 * dev = mult * ta.stdev(source, length)
 * bbw = (((basis + dev) - (basis - dev)) / basis) * 100
 */
export function bbw(context: any) {
    return (source: any, _length: any, _mult: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        const mult = Series.from(_mult).get(0);

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `bbw_${length}_${mult}`;
        if (!context.taState[stateKey]) context.taState[stateKey] = new CallWindow();
        const win: CallWindow = context.taState[stateKey];
        win.begin(context.idx);

        const currentValue = Series.from(source).get(0);

        // An na value leaves the window as it was
        if (isNaN(currentValue)) {
            win.t = null;
            return NaN;
        }

        // Running sum of the window: committed in win.agg, this call's in win.tAgg
        win.tAgg = (win.agg ?? 0) + currentValue;
        win.push(context.idx, currentValue, length, OPTIONS, source);
        const sum = win.tAgg;

        if (win.size < length) {
            return NaN;
        }

        const basis = sum / length;

        // Standard deviation summed over the window (a running sum of squares would cancel)
        const values = win.values(length);
        let sumSqDiff = 0;
        for (let i = 0; i < length; i++) {
            const diff = values[i] - basis;
            sumSqDiff += diff * diff;
        }
        const variance = sumSqDiff / length;
        const stdev = Math.sqrt(variance);

        const dev = mult * stdev;

        if (basis === 0) {
            return context.precision(0);
        }

        const bbw = ((2 * dev) / basis) * 100;
        return context.precision(bbw);
    };
}
