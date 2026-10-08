// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { CarryHistory, ExtremeTail } from '../utils/history';

class StochState {
    highs = new CarryHistory(0, undefined, false);
    lows = new CarryHistory(0, undefined, false);
    hi = new ExtremeTail(true);
    lo = new ExtremeTail(false);
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
 * - In a local block the highs and lows are those of the last `length` bars, a skipped bar repeating
 *   the last call's; `length` may change from call to call
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

        state.highs.push(context.idx, currentHigh, length);
        state.lows.push(context.idx, currentLow, length);
        const hh = state.highs.h;
        const lh = state.lows.h;
        if (state.highs.newBar) {
            state.prev = state.cur;
            state.hi.commit(hh);
            state.lo.commit(lh);
        } else {
            state.hi.rollback();
            state.lo.rollback();
        }
        state.hi.sync(hh);
        state.lo.sync(lh);

        // Not enough data yet
        if (!(length >= 1) || hh.size < length) {
            return result(context, state, NaN);
        }

        // Highest high and lowest low like ta.highest / ta.lowest: only the bars since the most
        // recent na in the window take part, and an na on the current bar makes them na.
        const jh = state.hi.find(hh, length);
        const jl = state.lo.find(lh, length);
        const highest = jh < 0 ? NaN : hh.get(jh);
        const lowest = jl < 0 ? NaN : lh.get(jl);

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
