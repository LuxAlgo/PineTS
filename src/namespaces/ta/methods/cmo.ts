// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Chande Momentum Oscillator (CMO)
 *
 * Calculates the difference between the sum of recent gains and the sum of recent losses
 * and then divides the result by the sum of all price movement over the same period.
 *
 * Pine Script Formula:
 * mom = change(src)
 * sm1 = sum((mom >= 0) ? mom : 0.0, length)
 * sm2 = sum((mom >= 0) ? 0.0 : -mom, length)
 * cmo = 100 * (sm1 - sm2) / (sm1 + sm2)
 *
 * @param source - Source series (typically close)
 * @param length - Number of bars (lookback period)
 * @returns CMO value (-100 to +100)
 */
export function cmo(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `cmo_${length}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: -1,
                // Committed state
                prevGainsWindow: [],
                prevLossesWindow: [],
                prevGainsSum: 0,
                prevLossesSum: 0,
                prevLength: undefined,
                // Tentative state
                currentGainsWindow: [],
                currentLossesWindow: [],
                currentGainsSum: 0,
                currentLossesSum: 0,
                currentLength: undefined,
            };
        }

        const state = context.taState[stateKey];

        // Commit logic
        if (context.idx > state.lastIdx) {
            if (state.lastIdx >= 0) {
                state.prevGainsWindow = [...state.currentGainsWindow];
                state.prevLossesWindow = [...state.currentLossesWindow];
                state.prevGainsSum = state.currentGainsSum;
                state.prevLossesSum = state.currentLossesSum;
                state.prevLength = state.currentLength;
            }
            state.lastIdx = context.idx;
        }

        // Get current and previous values
        const currentValue = Series.from(source).get(0);
        const previousValue = Series.from(source).get(1);

        // Handle NaN inputs
        if (isNaN(currentValue) || isNaN(previousValue)) {
            // Can't calculate mom, so can't update properly. Return NaN.
            // Tentative state update: effectively no-op or push 0?
            // If input is NaN, typically we skip. For window integrity, pushing 0 gain/loss is safest to keep window size correct?
            // Or return NaN and don't update? Standard is return NaN.
            // If we don't update window, it lags. If we push 0, it dilutes.
            // Let's assume 0 gain/loss for window maintenance.
            // Actually, if we return NaN, we might want to carry over previous state?
            // Let's mirror CCI handling - return NaN but maintain window if possible, or just fail out.
            return NaN;
        }

        // Calculate momentum (change)
        const mom = currentValue - previousValue;

        // Calculate gains and losses
        const gain = mom >= 0 ? mom : 0;
        const loss = mom >= 0 ? 0 : -mom; 

        let gainsWindow: number[];
        let lossesWindow: number[];
        let gainsSum: number;
        let lossesSum: number;

        if (state.prevLength !== undefined && state.prevLength !== length) {
            // A series length changed: rebuild the windows from the source history
            gainsWindow = [];
            lossesWindow = [];
            gainsSum = 0;
            lossesSum = 0;
            const series = Series.from(source);
            for (let i = 0; i < length; i++) {
                const m = series.get(i) - series.get(i + 1);
                if (isNaN(m)) break;
                gainsWindow.push(m >= 0 ? m : 0);
                lossesWindow.push(m >= 0 ? 0 : -m);
                gainsSum += gainsWindow[i];
                lossesSum += lossesWindow[i];
            }
        } else {
            // Use committed state
            gainsWindow = [...state.prevGainsWindow];
            lossesWindow = [...state.prevLossesWindow];
            gainsSum = state.prevGainsSum;
            lossesSum = state.prevLossesSum;

            // Add to windows
            gainsWindow.unshift(gain);
            lossesWindow.unshift(loss);
            gainsSum += gain;
            lossesSum += loss;
        }
        state.currentLength = length;

        // Not enough data yet
        if (gainsWindow.length < length) {
            state.currentGainsWindow = gainsWindow;
            state.currentLossesWindow = lossesWindow;
            state.currentGainsSum = gainsSum;
            state.currentLossesSum = lossesSum;
            return NaN;
        }

        // Remove oldest values if window exceeds length
        if (gainsWindow.length > length) {
            const oldGain = gainsWindow.pop();
            const oldLoss = lossesWindow.pop();
            gainsSum -= oldGain;
            lossesSum -= oldLoss;
        }

        // Update tentative state
        state.currentGainsWindow = gainsWindow;
        state.currentLossesWindow = lossesWindow;
        state.currentGainsSum = gainsSum;
        state.currentLossesSum = lossesSum;

        // Calculate CMO
        const denominator = gainsSum + lossesSum;
        
        if (denominator === 0) {
            return context.precision(0); 
        }

        const cmo = 100 * (gainsSum - lossesSum) / denominator;

        return context.precision(cmo);
    };
}
