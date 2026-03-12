// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { getDatePartsInTimezone } from '../../Time';

/**
 * VWAP - Volume Weighted Average Price
 *
 * VWAP calculates the average price weighted by volume for a trading session.
 * It resets at the start of each new session (typically daily).
 *
 * Formula: VWAP = Σ(Price × Volume) / Σ(Volume)
 *
 * @param source - The price source (typically close, hlc3, or ohlc4)
 *
 * Note: This implementation resets VWAP at the start of each trading session
 * based on detecting new trading days (when openTime changes to a new day).
 */
export function vwap(context: any) {
    return (source: any, _callId?: string) => {
        // VWAP calculation using cumulative sums
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `vwap`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: -1,
                // Committed state
                prevCumulativePV: 0, // Cumulative price * volume
                prevCumulativeVolume: 0, // Cumulative volume
                prevLastSessionDate: null, // Track last session date
                // Tentative state
                currentCumulativePV: 0,
                currentCumulativeVolume: 0,
                currentLastSessionDate: null,
            };
        }

        const state = context.taState[stateKey];

        // Commit logic
        if (context.idx > state.lastIdx) {
            if (state.lastIdx >= 0) {
                state.prevCumulativePV = state.currentCumulativePV;
                state.prevCumulativeVolume = state.currentCumulativeVolume;
                state.prevLastSessionDate = state.currentLastSessionDate;
            }
            state.lastIdx = context.idx;
        }

        // Get current values
        const currentPrice = Series.from(source).get(0);
        const currentVolume = Series.from(context.data.volume).get(0);

        // Get current bar's open time to detect session changes
        const currentOpenTime = Series.from(context.data.openTime).get(0);

        // Detect new session (new trading day) using exchange timezone
        const timezone = context.pine?.syminfo?.timezone || 'UTC';
        const parts = getDatePartsInTimezone(currentOpenTime, timezone);
        const currentSessionDate = `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;

        // Use committed state
        let cumulativePV = state.prevCumulativePV;
        let cumulativeVolume = state.prevCumulativeVolume;
        let lastSessionDate = state.prevLastSessionDate;

        // Reset VWAP at the start of a new session
        if (lastSessionDate !== currentSessionDate) {
            cumulativePV = 0;
            cumulativeVolume = 0;
            lastSessionDate = currentSessionDate;
        }

        // Update cumulative values
        cumulativePV += currentPrice * currentVolume;
        cumulativeVolume += currentVolume;

        // Store tentative state
        state.currentCumulativePV = cumulativePV;
        state.currentCumulativeVolume = cumulativeVolume;
        state.currentLastSessionDate = lastSessionDate;

        // Calculate VWAP
        if (cumulativeVolume === 0) {
            return NaN;
        }

        const vwap = cumulativePV / cumulativeVolume;
        return context.precision(vwap);
    };
}
