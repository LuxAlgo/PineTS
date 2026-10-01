// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { getDatePartsInTimezone } from '../../Time';

/**
 * VWAP - Volume Weighted Average Price
 *
 * Forms:
 * - `ta.vwap` (built-in variable): VWAP of hlc3
 * - `ta.vwap(source)`: resets at the start of each trading day (exchange timezone)
 * - `ta.vwap(source, anchor)`: resets on every bar where `anchor` is true; na until the first reset
 * - `ta.vwap(source, anchor, stdev_mult)`: tuple [vwap, upper band, lower band]
 *
 * Formula: VWAP = Σ(Price × Volume) / Σ(Volume)
 * Bands: VWAP ± stdev_mult × sqrt(Σ(Price² × Volume) / Σ(Volume) − VWAP²)
 */
export function vwap(context: any) {
    return (...args: any[]) => {
        // The transpiler appends the call id after the optional arguments; the bare
        // variable form passes it alone.
        const _callId: string | undefined = typeof args[args.length - 1] === 'string' ? args.pop() : undefined;
        const source = args.length > 0 ? args[0] : context.data.hlc3;
        const hasAnchor = args.length >= 2;
        const hasBands = args.length >= 3;

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `vwap_${args.length}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: -1,
                // Committed state
                prevCumulativePV: 0, // Cumulative price * volume
                prevCumulativeVolume: 0, // Cumulative volume
                prevCumulativePPV: 0, // Cumulative price² * volume
                prevStarted: false,
                prevLastSessionDate: null, // Track last session date
                // Tentative state
                currentCumulativePV: 0,
                currentCumulativeVolume: 0,
                currentCumulativePPV: 0,
                currentStarted: false,
                currentLastSessionDate: null,
            };
        }

        const state = context.taState[stateKey];

        // Commit logic
        if (context.idx > state.lastIdx) {
            if (state.lastIdx >= 0) {
                state.prevCumulativePV = state.currentCumulativePV;
                state.prevCumulativeVolume = state.currentCumulativeVolume;
                state.prevCumulativePPV = state.currentCumulativePPV;
                state.prevStarted = state.currentStarted;
                state.prevLastSessionDate = state.currentLastSessionDate;
            }
            state.lastIdx = context.idx;
        }

        const currentPrice = Series.from(source).get(0);
        const currentVolume = Series.from(context.data.volume).get(0);

        let cumulativePV = state.prevCumulativePV;
        let cumulativeVolume = state.prevCumulativeVolume;
        let cumulativePPV = state.prevCumulativePPV;
        let started = state.prevStarted;
        let lastSessionDate = state.prevLastSessionDate;

        let reset: boolean;
        if (hasAnchor) {
            reset = !!Series.from(args[1]).get(0);
        } else {
            // Detect new session (new trading day) using exchange timezone
            const currentOpenTime = Series.from(context.data.openTime).get(0);
            const timezone = context.pine?.syminfo?.timezone || 'UTC';
            const parts = getDatePartsInTimezone(currentOpenTime, timezone);
            const currentSessionDate = `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
            reset = lastSessionDate !== currentSessionDate;
            lastSessionDate = currentSessionDate;
        }

        if (reset) {
            cumulativePV = 0;
            cumulativeVolume = 0;
            cumulativePPV = 0;
            started = true;
        }

        if (started) {
            cumulativePV += currentPrice * currentVolume;
            cumulativeVolume += currentVolume;
            cumulativePPV += currentPrice * currentPrice * currentVolume;
        }

        // Store tentative state
        state.currentCumulativePV = cumulativePV;
        state.currentCumulativeVolume = cumulativeVolume;
        state.currentCumulativePPV = cumulativePPV;
        state.currentStarted = started;
        state.currentLastSessionDate = lastSessionDate;

        const vwap = started && cumulativeVolume !== 0 ? cumulativePV / cumulativeVolume : NaN;

        if (!hasBands) {
            return isNaN(vwap) ? NaN : context.precision(vwap);
        }

        const mult = Series.from(args[2]).get(0);
        const variance = cumulativePPV / cumulativeVolume - vwap * vwap;
        const deviation = Math.sqrt(Math.max(variance, 0));
        return [[context.precision(vwap), context.precision(vwap + mult * deviation), context.precision(vwap - mult * deviation)]];
    };
}
