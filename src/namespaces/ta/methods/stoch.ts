// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

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

        // Use incremental calculation with rolling windows for highest/lowest
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `stoch_${length}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: -1,
                // Committed state
                prevHighWindow: [],
                prevLowWindow: [],
                prevStoch: NaN,
                // Tentative state
                currentHighWindow: [],
                currentLowWindow: [],
                currentStoch: NaN,
            };
        }

        const state = context.taState[stateKey];

        // Commit logic
        if (context.idx > state.lastIdx) {
            if (state.lastIdx >= 0) {
                state.prevHighWindow = [...state.currentHighWindow];
                state.prevLowWindow = [...state.currentLowWindow];
                state.prevStoch = state.currentStoch;
            }
            state.lastIdx = context.idx;
        }
        
        // Get current values
        const currentSource = Series.from(source).get(0);
        const currentHigh = Series.from(high).get(0);
        const currentLow = Series.from(low).get(0);

        const highWindow = [...state.prevHighWindow];
        const lowWindow = [...state.prevLowWindow];

        // Add current values to windows
        highWindow.unshift(currentHigh);
        lowWindow.unshift(currentLow);

        // Remove oldest values if window exceeds length
        if (highWindow.length > length) {
            highWindow.pop();
            lowWindow.pop();
        }
        
        // Update tentative state
        state.currentHighWindow = highWindow;
        state.currentLowWindow = lowWindow;

        // As on TradingView, a bar whose stochastic is na (na source, na high / low, not enough bars)
        // repeats the previous value.
        const result = (value: number) => {
            if (Number.isNaN(value)) {
                state.currentStoch = state.prevStoch;
                return state.prevStoch;
            }
            state.currentStoch = value;
            return context.precision(value);
        };

        // Not enough data yet
        if (highWindow.length < length) {
            return result(NaN);
        }

        // Highest high and lowest low like ta.highest / ta.lowest: only the bars since the most
        // recent na in the window take part, and an na on the current bar makes them na.
        const extreme = (window: number[], higher: boolean) => {
            let best = NaN;
            for (let i = 0; i < length; i++) {
                const v = window[i];
                if (Number.isNaN(v)) break;
                if (Number.isNaN(best) || (higher ? v > best : v < best)) best = v;
            }
            return best;
        };
        const highest = extreme(highWindow, true);
        const lowest = extreme(lowWindow, false);

        // Calculate stochastic
        const range = highest - lowest;

        // A flat range repeats the previous value when the source sits on it; otherwise it is na and
        // that na is not replaced by the previous value (TradingView).
        if (range === 0) {
            if (currentSource === lowest) return result(NaN);
            state.currentStoch = NaN;
            return NaN;
        }

        return result((100 * (currentSource - lowest)) / range);
    };
}
