// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { ExtremeWindow } from '../utils/windows';

/**
 * Williams %R (WPR)
 *
 * The oscillator shows the current closing price in relation to the high and low
 * of the past 'length' bars.
 *
 * Formula:
 * %R = (Highest High - Close) / (Highest High - Lowest Low) * -100
 *
 * Note: Williams %R produces values between -100 and 0
 * - Values near -100 indicate oversold conditions
 * - Values near 0 indicate overbought conditions
 *
 * @param length - Number of bars (lookback period)
 * @returns Williams %R value (-100 to 0)
 */
export function wpr(context: any) {
    return (_length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `wpr_${length}`;
        if (!context.taState[stateKey]) context.taState[stateKey] = { highs: new ExtremeWindow(true, true), lows: new ExtremeWindow(false, true) };
        const hw: ExtremeWindow = context.taState[stateKey].highs;
        const lw: ExtremeWindow = context.taState[stateKey].lows;
        hw.begin(context.idx);
        lw.begin(context.idx);

        // Get current values from context.data
        const high = context.get(context.data.high, 0);
        const low = context.get(context.data.low, 0);
        const close = context.get(context.data.close, 0);

        // An na bar leaves the windows as they were
        if (isNaN(high) || isNaN(low) || isNaN(close)) {
            hw.t = null;
            lw.t = null;
            return NaN;
        }

        hw.push(context.idx, high, length, { trimOnce: true });
        lw.push(context.idx, low, length, { trimOnce: true });

        // Not enough data yet
        if (hw.size < length) {
            return NaN;
        }

        // Highest high and lowest low of the last `length` values (the windows hold no na)
        const highestHigh = hw.extreme(length);
        const lowestLow = lw.extreme(length);

        // Calculate Williams %R
        const range = highestHigh - lowestLow;

        if (range === 0) {
            return context.precision(0); // Avoid division by zero
        }

        // Williams %R formula: (Highest High - Close) / (Highest High - Lowest Low) * -100
        const wpr = ((highestHigh - close) / range) * -100;

        return context.precision(wpr);
    };
}
