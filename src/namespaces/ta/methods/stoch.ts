// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { nonNaWindow } from '../utils/nonNaWindow';

class StochState {
    lastIdx = -1;
    // the value of the previous call (committed) and of this one
    prev = NaN;
    cur = NaN;
}

/**
 * As on TradingView, a bar whose stochastic is na (na source, na high / low, not enough bars) repeats
 * the previous value.
 */
function result(context: any, state: StochState, value: number): number {
    if (Number.isNaN(value)) {
        state.cur = state.prev;
        return state.prev;
    }
    state.cur = value;
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
 * - The highs and lows are the last `length` non-na values (in a local block, of the calls), as
 *   ta.highest / ta.lowest; `length` may change from call to call
 */
export function stoch(context: any) {
    return (source: any, high: any, low: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `stoch_${length}`;
        const state: StochState = (context.taState[stateKey] ??= new StochState());

        // Get current values
        const currentSource = Series.from(source).get(0);
        const currentHigh = Series.from(high).get(0);
        const currentLow = Series.from(low).get(0);

        if (context.idx !== state.lastIdx) {
            state.prev = state.cur;
            state.lastIdx = context.idx;
        }
        const hw = nonNaWindow(context, `${stateKey}_h`, Series.from(high), length, 'extremes', currentHigh);
        const lw = nonNaWindow(context, `${stateKey}_l`, Series.from(low), length, 'extremes', currentLow);

        // Not enough data yet
        if (!hw || !lw) {
            return result(context, state, NaN);
        }

        // Highest high and lowest low like ta.highest / ta.lowest: the last `length` non-na values
        const highest = hw.max();
        const lowest = lw.min();

        // Calculate stochastic
        const range = highest - lowest;

        // A flat range repeats the previous value when the source sits on it; otherwise it is na and
        // that na is not replaced by the previous value (TradingView).
        if (range === 0) {
            if (currentSource === lowest) return result(context, state, NaN);
            state.cur = NaN;
            return NaN;
        }

        return result(context, state, (100 * (currentSource - lowest)) / range);
    };
}
