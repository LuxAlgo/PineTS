// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { nonNaWindow } from '../utils/nonNaWindow';
import { CallWindow } from '../utils/windows';

/** Gains (or losses) of the bar history of `series`, read by a backfill. */
class MomentumHistory {
    series: any;
    constructor(private readonly up: boolean) {}
    get(k: number): number {
        const m = this.series.get(k) - this.series.get(k + 1);
        return this.up ? (m >= 0 ? m : 0) : m >= 0 ? 0 : -m;
    }
}

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
 * Computed as that formula is on TradingView: an na momentum adds 0 to sm1 and is skipped by sm2
 * (math.sum skips na), and the change is from the previous call (in a local block, the last call).
 *
 * @param source - Source series (typically close)
 * @param length - Number of bars (lookback period)
 * @returns CMO value (-100 to +100)
 */
export function cmo(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        const series = Series.from(source);

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `cmo_${length}`;
        if (!context.taState[stateKey]) context.taState[stateKey] = { prev: new CallWindow(), up: new MomentumHistory(true), down: new MomentumHistory(false) };
        const state = context.taState[stateKey];
        const prev: CallWindow = state.prev;
        prev.begin(context.idx);
        state.up.series = state.down.series = series;

        // the source of the previous call; before the first call, of the previous bar
        const currentValue = series.get(0);
        const previousValue = prev.ring.size ? prev.ring.at(0) : series.get(1);
        prev.push(context.idx, currentValue, 1);

        const mom = currentValue - previousValue;
        const gains = nonNaWindow(context, `${stateKey}_up`, state.up, length, false, mom >= 0 ? mom : 0);
        const losses = nonNaWindow(context, `${stateKey}_down`, state.down, length, false, mom >= 0 ? 0 : -mom);
        if (!gains || !losses) {
            return NaN;
        }

        // Calculate CMO
        const denominator = gains.sum + losses.sum;

        if (denominator === 0) {
            return context.precision(0);
        }

        const cmo = (100 * (gains.sum - losses.sum)) / denominator;

        return context.precision(cmo);
    };
}
