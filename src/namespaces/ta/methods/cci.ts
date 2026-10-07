// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { nonNaWindow } from '../utils/nonNaWindow';
import { CallWindow, PushOptions } from '../utils/windows';

// Backfill stopping at the first na of the source history
const BACKFILL_UNTIL_NA: PushOptions = {
    backfill: (window, _win, source, length) => {
        const series = Series.from(source);
        while (window.length < length) {
            const val = series.get(window.length);
            if (isNaN(val)) break;
            window.push(val);
        }
    },
};

/**
 * Commodity Channel Index (CCI)
 *
 * CCI measures the deviation of the price from its average price.
 * It's used to identify cyclical trends and overbought/oversold conditions.
 *
 * Formula:
 * - Typical Price (TP) = (high + low + close) / 3
 * - CCI = (TP - SMA(TP, length)) / (0.015 × Mean Deviation)
 * - Mean Deviation = Average of |TP - SMA(TP)| over length periods
 *
 * @param source - Source series (typically close price, but can be any price)
 * @param length - Number of bars back (lookback period)
 * @returns CCI value
 *
 * @remarks
 * - Returns NaN during initialization period (when not enough data)
 * - The constant 0.015 ensures approximately 70-80% of values fall between -100 and +100
 * - As TradingView computes it: the SMA skips na values (in a local block it is over the calls) and
 *   the mean deviation is over the last `length` bars, a bar skipped by a local block repeating the
 *   last call's value; an na among those bars gives na (as ta.dev)
 * - The mean deviation moves with the mean, so it is summed over the window on every bar
 */
export function cci(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        const series = Series.from(source);

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `cci_${length}`;
        if (!context.taState[stateKey]) context.taState[stateKey] = new CallWindow(true);
        const bars: CallWindow = context.taState[stateKey];
        bars.begin(context.idx);

        const currentValue = series.get(0);
        bars.push(context.idx, currentValue, length, BACKFILL_UNTIL_NA, source);
        const mean = nonNaWindow(context, `${stateKey}_mean`, series, length);

        // Not enough data yet
        if (!mean || bars.size < length) {
            return NaN;
        }

        // Calculate SMA (mean)
        const sma = mean.sum / length;

        // Calculate Mean Deviation
        const values = bars.values(length);
        let sumAbsoluteDeviations = 0;
        for (let i = 0; i < length; i++) {
            sumAbsoluteDeviations += Math.abs(values[i] - sma);
        }
        const meanDeviation = sumAbsoluteDeviations / length;

        // Avoid division by zero
        if (meanDeviation === 0) {
            return 0;
        }

        // Calculate CCI
        const cci = (currentValue - sma) / (0.015 * meanDeviation);

        return context.precision(cci);
    };
}
