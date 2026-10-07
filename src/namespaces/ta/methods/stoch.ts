// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { ExtremeWindow } from '../utils/windows';

/**
 * As on TradingView, a bar whose stochastic is na (na source, na high / low, not enough bars) repeats
 * the previous value. The value is committed with the windows (`agg` / `tAgg` of the highs).
 */
function result(context: any, hw: ExtremeWindow, value: number): number {
    if (Number.isNaN(value)) {
        const prevStoch = hw.agg === undefined ? NaN : hw.agg;
        hw.tAgg = prevStoch;
        return prevStoch;
    }
    hw.tAgg = value;
    return context.precision(value);
}

/**
 * Stochastic Oscillator (STOCH)
 *
 * The Stochastic Oscillator is a momentum indicator that shows the location of the close
 * relative to the high-low range over a set number of periods.
 *
 * Formula:
 * STOCH = 100 * (close - lowest(low, length)) / (highest(high, length) - lowest(low, length))
 *
 * @param source - Source series (typically close price)
 * @param high - Series of high prices
 * @param low - Series of low prices
 * @param length - Number of bars back (lookback period)
 * @returns Stochastic value (0-100)
 *
 * @remarks
 * - Returns NaN during initialization period (when not enough data)
 * - A bar whose value would be NaN because of an na input (source, high, low) repeats the previous value
 * - A flat range (highest equal to lowest) repeats the previous value when the source equals it and
 *   is NaN otherwise
 */
export function stoch(context: any) {
    return (source: any, high: any, low: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);

        // Rolling highest / lowest over the values of the last `length` calls
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `stoch_${length}`;
        if (!context.taState[stateKey]) context.taState[stateKey] = { highs: new ExtremeWindow(true, true), lows: new ExtremeWindow(false, true) };
        const hw: ExtremeWindow = context.taState[stateKey].highs;
        const lw: ExtremeWindow = context.taState[stateKey].lows;
        hw.begin(context.idx);
        lw.begin(context.idx);

        // Get current values
        const currentSource = Series.from(source).get(0);
        const currentHigh = Series.from(high).get(0);
        const currentLow = Series.from(low).get(0);

        hw.push(context.idx, currentHigh, length, { trimOnce: true });
        lw.push(context.idx, currentLow, length, { trimOnce: true });

        // Not enough data yet
        if (hw.size < length) {
            return result(context, hw, NaN);
        }

        // Highest high and lowest low like ta.highest / ta.lowest: only the bars since the most
        // recent na in the window take part, and an na on the current bar makes them na.
        const highest = hw.extreme(length);
        const lowest = lw.extreme(length);

        // Calculate stochastic
        const range = highest - lowest;

        // A flat range repeats the previous value when the source sits on it; otherwise it is na and
        // that na is not replaced by the previous value (TradingView).
        if (range === 0) {
            if (currentSource === lowest) return result(context, hw, NaN);
            hw.tAgg = NaN;
            return NaN;
        }

        return result(context, hw, (100 * (currentSource - lowest)) / range);
    };
}
