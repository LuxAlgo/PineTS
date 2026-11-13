// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * SuperTrend Indicator
 *
 * The Supertrend is a trend following indicator based on ATR.
 *
 * Pine Script Formula:
 * src = hl2
 * atr = ta.atr(atrPeriod)
 * upperBand = src + factor * atr
 * lowerBand = src - factor * atr
 * prevLowerBand = nz(lowerBand[1])
 * prevUpperBand = nz(upperBand[1])
 *
 * lowerBand := lowerBand > prevLowerBand or close[1] < prevLowerBand ? lowerBand : prevLowerBand
 * upperBand := upperBand < prevUpperBand or close[1] > prevUpperBand ? upperBand : prevUpperBand
 *
 * direction: 1 (down/bearish), -1 (up/bullish)
 * superTrend := direction == -1 ? lowerBand : upperBand
 *
 * @param factor - The multiplier by which the ATR will get multiplied
 * @param atrPeriod - Length of ATR
 * @returns Tuple [supertrend, direction] where direction is 1 (down) or -1 (up)
 */
export function supertrend(context: any) {
    return (_factor: any, _atrPeriod: any, _callId?: string) => {
        const atrPeriod = Series.from(_atrPeriod).get(0);

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `supertrend_${Series.from(_factor).get(0)}_${atrPeriod}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                // TradingView uses the factor of the first bar for the whole series
                factor: Series.from(_factor).get(0),
                lastIdx: -1,
                // Committed state
                prevTrSum: 0,
                prevAtrValue: NaN,
                prevAtrCount: 0,
                prevLowerBand: NaN,
                prevUpperBand: NaN,
                prevSuperTrend: NaN,
                prevDirection: NaN,
                // (prevClose removed — read directly from context)
                // Tentative state
                currentTrSum: 0,
                currentAtrValue: NaN,
                currentAtrCount: 0,
                currentLowerBand: NaN,
                currentUpperBand: NaN,
                currentSuperTrend: NaN,
                currentDirection: NaN,
            };
        }

        const state = context.taState[stateKey];
        const factor = state.factor;

        // Commit logic
        if (context.idx > state.lastIdx) {
            if (state.lastIdx >= 0) {
                state.prevTrSum = state.currentTrSum;
                state.prevAtrValue = state.currentAtrValue;
                state.prevAtrCount = state.currentAtrCount;
                state.prevLowerBand = state.currentLowerBand;
                state.prevUpperBand = state.currentUpperBand;
                state.prevSuperTrend = state.currentSuperTrend;
                state.prevDirection = state.currentDirection;
            }
            state.lastIdx = context.idx;
        }

        // Get current OHLC values
        const high = context.get(context.data.high, 0);
        const low = context.get(context.data.low, 0);
        const close = context.get(context.data.close, 0);

        // Handle NaN inputs
        if (isNaN(high) || isNaN(low) || isNaN(close)) {
            return [[NaN, NaN]];
        }

        // Calculate hl2 (source)
        const hl2 = (high + low) / 2;

        // Read previous close directly from context data — always correct
        // regardless of whether Supertrend was called on previous bars.
        // This fixes the stale-prevClose bug when Supertrend is called conditionally.
        const prevClose = context.idx > 0 ? context.get(context.data.close, 1) : NaN;

        // Calculate True Range
        let tr;
        if (isNaN(prevClose)) {
            tr = high - low;
        } else {
            tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
        }

        // Calculate ATR using RMA (using committed state)
        let atrCount = state.prevAtrCount;
        let trSum = state.prevTrSum;
        let atrValue = state.prevAtrValue;

        atrCount++;
        if (atrCount <= atrPeriod) {
            trSum += tr;
            if (atrCount === atrPeriod) {
                atrValue = trSum / atrPeriod;
            }
        } else {
            // RMA formula: rma = (prev_rma * (length - 1) + current) / length
            atrValue = (atrValue * (atrPeriod - 1) + tr) / atrPeriod;
        }

        const atr = atrValue;

        // Store tentative state for ATR
        state.currentAtrCount = atrCount;
        state.currentTrSum = trSum;
        state.currentAtrValue = atrValue;

        // TradingView's formula as written, na comparisons being false: before the ATR exists a band
        // falls back to nz() of the previous one, so the first bar reads 0 with direction 1 and the
        // following warm-up bars read na.
        let upperBand = hl2 + factor * atr;
        let lowerBand = hl2 - factor * atr;
        const prevLowerBand = isNaN(state.prevLowerBand) ? 0 : state.prevLowerBand;
        const prevUpperBand = isNaN(state.prevUpperBand) ? 0 : state.prevUpperBand;
        lowerBand = lowerBand > prevLowerBand || prevClose < prevLowerBand ? lowerBand : prevLowerBand;
        upperBand = upperBand < prevUpperBand || prevClose > prevUpperBand ? upperBand : prevUpperBand;

        // Determine direction
        let direction: number;
        let superTrend: number;

        const prevSuperTrend = state.prevSuperTrend;

        if (isNaN(state.prevAtrValue)) {
            // na(atr[1])
            direction = 1;
        } else if (prevSuperTrend === prevUpperBand) {
            // Previous supertrend was upper band (bearish)
            direction = close > upperBand ? -1 : 1;
        } else {
            // Previous supertrend was lower band (bullish)
            direction = close < lowerBand ? 1 : -1;
        }

        // Set supertrend based on direction
        superTrend = direction === -1 ? lowerBand : upperBand;

        // Store tentative state for bands & supertrend
        state.currentLowerBand = lowerBand;
        state.currentUpperBand = upperBand;
        state.currentSuperTrend = superTrend;
        state.currentDirection = direction;

        return [[context.precision(superTrend), direction]];
    };
}
