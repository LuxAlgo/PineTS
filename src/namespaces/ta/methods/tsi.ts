// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * True Strength Index (TSI)
 *
 * True strength index uses moving averages of the underlying momentum of a financial instrument.
 *
 * Formula:
 * pc = change(source)                    // Price change
 * double_smoothed_pc = ema(ema(pc, long_length), short_length)
 * double_smoothed_abs_pc = ema(ema(abs(pc), long_length), short_length)
 * tsi = double_smoothed_pc / double_smoothed_abs_pc
 *
 * @param source - Source series (typically close)
 * @param shortLength - Short EMA length
 * @param longLength - Long EMA length
 * @returns TSI value in range [-1, 1]
 */
export function tsi(context: any) {
    return (source: any, _shortLength: any, _longLength: any, _callId?: string) => {
        const shortLength = Series.from(_shortLength).get(0);
        const longLength = Series.from(_longLength).get(0);

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `tsi_${shortLength}_${longLength}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: -1,
                // Committed state
                prevSource: NaN,
                
                prevEma1PcValue: NaN,
                prevEma1PcCount: 0,
                prevEma1PcSum: 0,

                prevEma2PcValue: NaN,
                prevEma2PcCount: 0,
                prevEma2PcSum: 0,

                prevEma1AbsValue: NaN,
                prevEma1AbsCount: 0,
                prevEma1AbsSum: 0,

                prevEma2AbsValue: NaN,
                prevEma2AbsCount: 0,
                prevEma2AbsSum: 0,

                // Tentative state
                currentSource: NaN,

                currentEma1PcValue: NaN,
                currentEma1PcCount: 0,
                currentEma1PcSum: 0,

                currentEma2PcValue: NaN,
                currentEma2PcCount: 0,
                currentEma2PcSum: 0,

                currentEma1AbsValue: NaN,
                currentEma1AbsCount: 0,
                currentEma1AbsSum: 0,

                currentEma2AbsValue: NaN,
                currentEma2AbsCount: 0,
                currentEma2AbsSum: 0,
            };
        }

        const state = context.taState[stateKey];

        // Commit logic
        if (context.idx > state.lastIdx) {
            if (state.lastIdx >= 0) {
                state.prevSource = state.currentSource;

                state.prevEma1PcValue = state.currentEma1PcValue;
                state.prevEma1PcCount = state.currentEma1PcCount;
                state.prevEma1PcSum = state.currentEma1PcSum;

                state.prevEma2PcValue = state.currentEma2PcValue;
                state.prevEma2PcCount = state.currentEma2PcCount;
                state.prevEma2PcSum = state.currentEma2PcSum;

                state.prevEma1AbsValue = state.currentEma1AbsValue;
                state.prevEma1AbsCount = state.currentEma1AbsCount;
                state.prevEma1AbsSum = state.currentEma1AbsSum;

                state.prevEma2AbsValue = state.currentEma2AbsValue;
                state.prevEma2AbsCount = state.currentEma2AbsCount;
                state.prevEma2AbsSum = state.currentEma2AbsSum;
            }
            state.lastIdx = context.idx;
        }

        const currentSource = Series.from(source).get(0);

        // An na bar leaves the averages as they were, and the change on the next bar is na too (it
        // needs the value before it), as on TradingView.
        if (isNaN(currentSource)) {
            state.currentSource = NaN;
            return NaN;
        }

        // Calculate price change
        const pc = isNaN(state.prevSource) ? NaN : currentSource - state.prevSource;
        
        // Update tentative previous source for next bar
        state.currentSource = currentSource;

        if (isNaN(pc)) {
            return NaN;
        }

        const absPC = Math.abs(pc);

        const ema1PcMultiplier = 2 / (longLength + 1);
        const ema2PcMultiplier = 2 / (shortLength + 1);
        const ema1AbsMultiplier = 2 / (longLength + 1);
        const ema2AbsMultiplier = 2 / (shortLength + 1);

        // --- Calculate EMAs using committed state ---

        // 1. EMA of pc (long length)
        let ema1PcCount = state.prevEma1PcCount;
        let ema1PcSum = state.prevEma1PcSum;
        let ema1PcValue = state.prevEma1PcValue;

        ema1PcCount++;
        if (ema1PcCount <= longLength) {
            ema1PcSum += pc;
            if (ema1PcCount === longLength) {
                ema1PcValue = ema1PcSum / longLength;
            }
        } else {
            ema1PcValue = pc * ema1PcMultiplier + ema1PcValue * (1 - ema1PcMultiplier);
        }

        // 2. EMA of abs(pc) (long length)
        let ema1AbsCount = state.prevEma1AbsCount;
        let ema1AbsSum = state.prevEma1AbsSum;
        let ema1AbsValue = state.prevEma1AbsValue;

        ema1AbsCount++;
        if (ema1AbsCount <= longLength) {
            ema1AbsSum += absPC;
            if (ema1AbsCount === longLength) {
                ema1AbsValue = ema1AbsSum / longLength;
            }
        } else {
            ema1AbsValue = absPC * ema1AbsMultiplier + ema1AbsValue * (1 - ema1AbsMultiplier);
        }

        // Check if first EMAs are ready
        if (isNaN(ema1PcValue) || isNaN(ema1AbsValue)) {
            // Save tentative state
            state.currentEma1PcCount = ema1PcCount;
            state.currentEma1PcSum = ema1PcSum;
            state.currentEma1PcValue = ema1PcValue;
            
            state.currentEma1AbsCount = ema1AbsCount;
            state.currentEma1AbsSum = ema1AbsSum;
            state.currentEma1AbsValue = ema1AbsValue;
            return NaN;
        }

        // 3. Second EMA of pc (short length) - double smoothed
        let ema2PcCount = state.prevEma2PcCount;
        let ema2PcSum = state.prevEma2PcSum;
        let ema2PcValue = state.prevEma2PcValue;

        ema2PcCount++;
        if (ema2PcCount <= shortLength) {
            ema2PcSum += ema1PcValue;
            if (ema2PcCount === shortLength) {
                ema2PcValue = ema2PcSum / shortLength;
            }
        } else {
            ema2PcValue = ema1PcValue * ema2PcMultiplier + ema2PcValue * (1 - ema2PcMultiplier);
        }

        // 4. Second EMA of abs(pc) (short length) - double smoothed
        let ema2AbsCount = state.prevEma2AbsCount;
        let ema2AbsSum = state.prevEma2AbsSum;
        let ema2AbsValue = state.prevEma2AbsValue;

        ema2AbsCount++;
        if (ema2AbsCount <= shortLength) {
            ema2AbsSum += ema1AbsValue;
            if (ema2AbsCount === shortLength) {
                ema2AbsValue = ema2AbsSum / shortLength;
            }
        } else {
            ema2AbsValue = ema1AbsValue * ema2AbsMultiplier + ema2AbsValue * (1 - ema2AbsMultiplier);
        }

        // Save ALL tentative state
        state.currentEma1PcCount = ema1PcCount;
        state.currentEma1PcSum = ema1PcSum;
        state.currentEma1PcValue = ema1PcValue;

        state.currentEma1AbsCount = ema1AbsCount;
        state.currentEma1AbsSum = ema1AbsSum;
        state.currentEma1AbsValue = ema1AbsValue;

        state.currentEma2PcCount = ema2PcCount;
        state.currentEma2PcSum = ema2PcSum;
        state.currentEma2PcValue = ema2PcValue;

        state.currentEma2AbsCount = ema2AbsCount;
        state.currentEma2AbsSum = ema2AbsSum;
        state.currentEma2AbsValue = ema2AbsValue;

        // Check if second EMAs are ready
        if (isNaN(ema2PcValue) || isNaN(ema2AbsValue)) {
            return NaN;
        }

        // Avoid division by zero
        if (ema2AbsValue === 0) {
            return context.precision(0);
        }

        // Calculate TSI
        const tsi = ema2PcValue / ema2AbsValue;

        return context.precision(tsi);
    };
}
