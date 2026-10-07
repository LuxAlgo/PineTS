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
 * Bollinger Bands (BB)
 *
 * Bollinger Bands are volatility bands placed above and below a moving average.
 * Volatility is based on the standard deviation, which changes as volatility increases and decreases.
 *
 * Formula:
 * - Middle Band = SMA(source, length)
 * - Upper Band = Middle Band + (multiplier × Standard Deviation)
 * - Lower Band = Middle Band - (multiplier × Standard Deviation)
 *
 * @param source - The data source (typically close price)
 * @param length - The period for SMA and standard deviation (default 20)
 * @param mult - The multiplier for standard deviation (default 2)
 * @returns [upper, middle, lower]
 */
export function bb(context: any) {
    return (source: any, _length: any, _mult: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        const mult = Series.from(_mult).get(0);

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `bb_${length}_${mult}`;
        if (!context.taState[stateKey]) context.taState[stateKey] = new CallWindow();
        const win: CallWindow = context.taState[stateKey];
        win.begin(context.idx);

        const currentValue = Series.from(source).get(0);

        // An na value leaves the window as it was
        if (isNaN(currentValue)) {
            win.t = null;
            return [[NaN, NaN, NaN]];
        }

        // Running sum of the window: committed in win.agg, this call's in win.tAgg
        win.tAgg = (win.agg ?? 0) + currentValue;
        win.push(context.idx, currentValue, length, OPTIONS, source);
        const sum = win.tAgg;

        // Not enough data yet
        if (win.size < length) {
            return [[NaN, NaN, NaN]];
        }

        // Calculate middle band (SMA)
        const middle = sum / length;

        // Standard deviation summed over the window (a running sum of squares would cancel)
        const values = win.values(length);
        let sumSquaredDiff = 0;
        for (let i = 0; i < length; i++) {
            sumSquaredDiff += Math.pow(values[i] - middle, 2);
        }
        const stdev = Math.sqrt(sumSquaredDiff / length);

        // Calculate upper and lower bands
        const upper = middle + mult * stdev;
        const lower = middle - mult * stdev;

        // Return as tuple with double brackets
        return [[context.precision(middle), context.precision(upper), context.precision(lower)]];
    };
}
