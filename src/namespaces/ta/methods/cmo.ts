// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { nonNaWindow } from '../utils/nonNaWindow';
import { CallWindow } from '../utils/windows';

// The windows only hold the calls' values (passed as `current`): there is no source to read back.
const NO_SOURCE = { get: () => NaN };

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
        if (!context.taState[stateKey]) context.taState[stateKey] = { prev: new CallWindow() };
        const state = context.taState[stateKey];
        const prev: CallWindow = state.prev;
        prev.begin(context.idx);

        // the source of the previous call; na on the first call (TV: first called on bar 9, na until bar 14)
        const currentValue = series.get(0);
        const previousValue = prev.ring.size ? prev.ring.at(0) : NaN;
        prev.push(context.idx, currentValue, 1, undefined, context.executionBudget);

        const mom = currentValue - previousValue;
        const gains = nonNaWindow(context, `${stateKey}_up`, NO_SOURCE, length, false, mom >= 0 ? mom : 0);
        const losses = nonNaWindow(context, `${stateKey}_down`, NO_SOURCE, length, false, mom >= 0 ? 0 : -mom);
        if (!gains || !losses) {
            return NaN;
        }

        // Calculate CMO
        const denominator = gains.sum + losses.sum;

        // No movement at all is 0 / 0: na on TradingView.
        if (denominator === 0) {
            return NaN;
        }

        const cmo = (100 * (gains.sum - losses.sum)) / denominator;

        return context.precision(cmo);
    };
}
