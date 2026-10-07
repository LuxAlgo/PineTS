// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { nonNaWindow } from '../utils/nonNaWindow';
import { CallWindow } from '../utils/windows';

/** Upper (or lower) money flow of the bar history of `series`, read by a backfill. */
class FlowHistory {
    series: any;
    volume: any;
    constructor(private readonly up: boolean) {}
    get(k: number): number {
        const src = this.series.get(k);
        const ch = src - this.series.get(k + 1);
        return this.volume.get(k) * (this.up ? (ch <= 0 ? 0 : src) : ch >= 0 ? 0 : src);
    }
}

/**
 * Money Flow Index (MFI)
 *
 * MFI is a momentum indicator that uses price and volume to identify overbought or oversold conditions.
 *
 * Pine Script Formula:
 * upper = sum(volume * (change(src) <= 0 ? 0 : src), length)
 * lower = sum(volume * (change(src) >= 0 ? 0 : src), length)
 * mfi = 100.0 - (100.0 / (1.0 + upper / lower))
 *
 * Computed as that formula is on TradingView: an na flow is skipped by the sums, and the change is from
 * the previous call (in a local block, the last call).
 *
 * @param source - Source series (typically hlc3)
 * @param length - Number of bars back (lookback period)
 * @returns MFI value (0-100)
 */
export function mfi(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `mfi_${length}`;
        if (!context.taState[stateKey]) context.taState[stateKey] = { prev: new CallWindow(), up: new FlowHistory(true), down: new FlowHistory(false) };
        const state = context.taState[stateKey];
        const prev: CallWindow = state.prev;
        prev.begin(context.idx);

        // The change since the previous call (TradingView's ta.change inside the function, which in a
        // local block compares with the last call), the previous bar before the first call
        const series = Series.from(source);
        const volume = Series.from(context.data.volume);
        const currentSrc = series.get(0);
        const previousSrc = prev.ring.size ? prev.ring.at(0) : series.get(1);
        prev.push(context.idx, currentSrc, 1);
        const change = currentSrc - previousSrc;

        // upper: volume * src when the source rose (or its change is na), lower: when it fell. An na
        // flow (na source or volume) is skipped by the sums, as math.sum does on TradingView.
        const volume0 = volume.get(0);
        state.up.series = state.down.series = series;
        state.up.volume = state.down.volume = volume;
        const upper = nonNaWindow(context, `${stateKey}_up`, state.up, length, false, volume0 * (change <= 0 ? 0 : currentSrc));
        const lower = nonNaWindow(context, `${stateKey}_down`, state.down, length, false, volume0 * (change >= 0 ? 0 : currentSrc));
        if (!upper || !lower) {
            return NaN;
        }
        const upperSum = upper.sum;
        const lowerSum = lower.sum;
        // Calculate MFI
        if (lowerSum === 0) {
            return context.precision(100);
        }

        if (upperSum === 0) {
            return context.precision(0);
        }

        const mfi = 100.0 - 100.0 / (1.0 + upperSum / lowerSum);

        return context.precision(mfi);
    };
}
