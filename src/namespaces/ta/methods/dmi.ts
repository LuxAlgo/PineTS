// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Directional Movement Index (DMI)
 *
 * The DMI function returns the directional movement index.
 *
 * Formula:
 * up = high - high[1]
 * down = low[1] - low
 * plusDM = (up > down && up > 0) ? up : 0
 * minusDM = (down > up && down > 0) ? down : 0
 * tr = ta.tr
 * tru = rma(tr, diLength)
 * plus = rma(plusDM, diLength)
 * minus = rma(minusDM, diLength)
 * plusDI = 100 * plus / tru
 * minusDI = 100 * minus / tru
 * dx = 100 * abs(plusDI - minusDI) / (plusDI + minusDI)
 * adx = rma(dx, adxSmoothing)
 *
 * @param diLength - DI Period
 * @param adxSmoothing - ADX Smoothing Period
 * @returns Tuple of three DMI series: [+DI, -DI, ADX]
 */
export function dmi(context: any) {
    return (_diLength: any, _adxSmoothing: any, _callId?: string) => {
        const diLength = Series.from(_diLength).get(0);
        const adxSmoothing = Series.from(_adxSmoothing).get(0);

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `dmi_${diLength}_${adxSmoothing}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: -1,
                
                // Committed state
                // (prevHigh/prevLow/prevClose removed — read directly from context)

                // RMA states for TR, +DM, -DM
                prevTrInitSum: 0,
                prevPlusInitSum: 0,
                prevMinusInitSum: 0,
                prevInitCount: 0,

                prevSmoothedTR: NaN,
                prevSmoothedPlus: NaN,
                prevSmoothedMinus: NaN,

                // RMA state for ADX
                prevDxInitSum: 0,
                prevAdxInitCount: 0,
                prevADX: NaN,

                // Tentative state (current)
                currentTrInitSum: 0,
                currentPlusInitSum: 0,
                currentMinusInitSum: 0,
                currentInitCount: 0,

                currentSmoothedTR: NaN,
                currentSmoothedPlus: NaN,
                currentSmoothedMinus: NaN,

                currentDxInitSum: 0,
                currentAdxInitCount: 0,
                currentADX: NaN,
            };
        }

        const state = context.taState[stateKey];

        // Commit logic
        if (context.idx > state.lastIdx) {
            if (state.lastIdx >= 0) {
                state.prevTrInitSum = state.currentTrInitSum;
                state.prevPlusInitSum = state.currentPlusInitSum;
                state.prevMinusInitSum = state.currentMinusInitSum;
                state.prevInitCount = state.currentInitCount;

                state.prevSmoothedTR = state.currentSmoothedTR;
                state.prevSmoothedPlus = state.currentSmoothedPlus;
                state.prevSmoothedMinus = state.currentSmoothedMinus;

                state.prevDxInitSum = state.currentDxInitSum;
                state.prevAdxInitCount = state.currentAdxInitCount;
                state.prevADX = state.currentADX;
            }
            state.lastIdx = context.idx;
        }

        const high = context.get(context.data.high, 0);
        const low = context.get(context.data.low, 0);
        const close = context.get(context.data.close, 0);

        if (isNaN(high) || isNaN(low) || isNaN(close)) {
            return [[NaN, NaN, NaN]];
        }

        // Read previous bar's OHLC directly from context data — always correct
        // regardless of whether DMI was called on previous bars.
        // This fixes the stale-prevClose bug when DMI is called conditionally.
        const prevHigh = context.idx > 0 ? context.get(context.data.high, 1) : NaN;
        const prevLow = context.idx > 0 ? context.get(context.data.low, 1) : NaN;
        const prevClose = context.idx > 0 ? context.get(context.data.close, 1) : NaN;

        if (isNaN(prevHigh)) {
            // First bar — no previous data
            return [[NaN, NaN, NaN]];
        }

        // Calculate TR
        const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));

        // Calculate Directional Movement
        const up = high - prevHigh;
        const down = prevLow - low;

        const plusDM = (up > down && up > 0) ? up : 0;
        const minusDM = (down > up && down > 0) ? down : 0;

        // --- Calculate Smoothed TR, +DM, -DM (RMA with diLength) ---
        let initCount = state.prevInitCount;
        let trInitSum = state.prevTrInitSum;
        let plusInitSum = state.prevPlusInitSum;
        let minusInitSum = state.prevMinusInitSum;
        let smoothedTR = state.prevSmoothedTR;
        let smoothedPlus = state.prevSmoothedPlus;
        let smoothedMinus = state.prevSmoothedMinus;

        initCount++;

        if (initCount <= diLength) {
            trInitSum += tr;
            plusInitSum += plusDM;
            minusInitSum += minusDM;

            if (initCount === diLength) {
                smoothedTR = trInitSum / diLength;
                smoothedPlus = plusInitSum / diLength;
                smoothedMinus = minusInitSum / diLength;
            }
        } else {
            // Incremental RMA
            const alpha = 1 / diLength;
            smoothedTR = alpha * tr + (1 - alpha) * smoothedTR;
            smoothedPlus = alpha * plusDM + (1 - alpha) * smoothedPlus;
            smoothedMinus = alpha * minusDM + (1 - alpha) * smoothedMinus;
        }

        // Save tentative state
        state.currentInitCount = initCount;
        state.currentTrInitSum = trInitSum;
        state.currentPlusInitSum = plusInitSum;
        state.currentMinusInitSum = minusInitSum;
        state.currentSmoothedTR = smoothedTR;
        state.currentSmoothedPlus = smoothedPlus;
        state.currentSmoothedMinus = smoothedMinus;

        // If not enough data for DI, return NaNs
        if (initCount < diLength) {
            return [[NaN, NaN, NaN]];
        }

        // Calculate DI
        const plusDI = smoothedTR === 0 ? 0 : (100 * smoothedPlus / smoothedTR);
        const minusDI = smoothedTR === 0 ? 0 : (100 * smoothedMinus / smoothedTR);

        // Calculate DX
        const sumDI = plusDI + minusDI;
        const dx = sumDI === 0 ? 0 : (100 * Math.abs(plusDI - minusDI) / sumDI);

        // --- Calculate ADX (RMA of DX with adxSmoothing) ---
        let adxInitCount = state.prevAdxInitCount;
        let dxInitSum = state.prevDxInitSum;
        let prevADX = state.prevADX;
        let adx = NaN;

        adxInitCount++;

        if (adxInitCount <= adxSmoothing) {
            dxInitSum += dx;

            if (adxInitCount === adxSmoothing) {
                prevADX = dxInitSum / adxSmoothing;
                adx = prevADX;
            }
        } else {
            const alphaAdx = 1 / adxSmoothing;
            prevADX = alphaAdx * dx + (1 - alphaAdx) * prevADX;
            adx = prevADX;
        }

        // Save tentative state
        state.currentAdxInitCount = adxInitCount;
        state.currentDxInitSum = dxInitSum;
        state.currentADX = prevADX;

        return [[context.precision(plusDI), context.precision(minusDI), context.precision(adx)]];
    };
}
