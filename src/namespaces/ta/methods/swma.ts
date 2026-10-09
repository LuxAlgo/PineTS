// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { BACKFILL_FROM_SOURCE, CallWindow } from '../utils/windows';

/**
 * SWMA - Symmetrically Weighted Moving Average
 *
 * Pine Script's ta.swma() uses a fixed period of 4 bars with symmetric weights.
 * The weights are applied symmetrically: the current and 3 previous bars.
 *
 * Weights for 4-bar period: [1, 2, 2, 1]
 * Formula: SWMA = (price[3]*1 + price[2]*2 + price[1]*2 + price[0]*1) / 6
 *
 * @param source - The data source (typically close price)
 *
 * Note: Unlike other moving averages, SWMA has a fixed period of 4 in Pine Script
 */
export function swma(context: any) {
    return (source: any, _callId?: string) => {
        const period = 4; // Fixed period for SWMA
        const weights = [1, 2, 2, 1]; // Symmetric weights
        const weightSum = 6; // Sum of weights

        // The last 4 values; in a local block, as on TradingView, a skipped bar repeats the last call's value
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `swma`;
        if (!context.taState[stateKey]) context.taState[stateKey] = new CallWindow(true);
        const win: CallWindow = context.taState[stateKey];
        win.begin(context.idx);
        win.push(context.idx, Series.from(source).get(0), period, BACKFILL_FROM_SOURCE, source);
        const window = win.values(win.size);
        if (window.length < period) {
            return NaN;
        }

        // Calculate symmetrically weighted average
        let swma = 0;
        for (let i = 0; i < period; i++) {
            swma += weights[i] * window[period - 1 - i];
        }
        swma /= weightSum;

        return context.precision(swma);
    };
}
