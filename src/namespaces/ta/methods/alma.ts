// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { BACKFILL_FROM_SOURCE, CallWindow } from '../utils/windows';

/**
 * ALMA - Arnaud Legoux Moving Average
 * 
 * ALMA uses a Gaussian distribution to weight the moving average,
 * reducing lag while maintaining smoothness.
 * 
 * @param source - The data source (typically close price)
 * @param period - The number of periods (window size)
 * @param offset - Position of Gaussian peak (0-1, default 0.85). Higher = more responsive
 * @param sigma - Width of Gaussian curve (default 6). Higher = smoother
 * @param floor - Floor the peak position `offset * (period - 1)` (default false)
 * 
 * Formula:
 * - m = offset * (period - 1)   (floored when `floor` is true)
 * - s = period / sigma
 * - weight[i] = exp(-((i - m)^2) / (2 * s^2))
 * - ALMA = sum(weight[i] * price[i]) / sum(weight[i])
 *
 * The Gaussian weights have no running form, so each bar sums its `period` values (no copy of the
 * window).
 */
export function alma(context: any) {
    return (source: any, _period: any, _offset: any, _sigma: any, ...rest: any[]) => {
        // The transpiler appends the call id after the optional `floor` argument.
        const _callId: string | undefined = typeof rest[rest.length - 1] === 'string' ? rest.pop() : undefined;
        const period = Series.from(_period).get(0);
        const offset = Series.from(_offset).get(0);
        const sigma = Series.from(_sigma).get(0);
        const floor = rest.length > 0 && !!Series.from(rest[0]).get(0);

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `alma_${period}_${offset}_${sigma}_${floor}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                win: new CallWindow(true),
                // Weights for `weightsKey`; a series length recomputes them
                weightsKey: '',
                weights: [],
            };
        }

        const state = context.taState[stateKey];
        const win: CallWindow = state.win;

        const weightsKey = `${period}_${offset}_${sigma}_${floor}`;
        if (state.weightsKey !== weightsKey) {
            const m = floor ? Math.floor(offset * (period - 1)) : offset * (period - 1);
            const s = period / sigma;
            const weights = [];
            let weightSum = 0;

            for (let i = 0; i < period; i++) {
                const weight = Math.exp(-Math.pow(i - m, 2) / (2 * s * s));
                weights.push(weight);
                weightSum += weight;
            }

            // Normalize weights
            for (let i = 0; i < weights.length; i++) {
                weights[i] /= weightSum;
            }
            state.weights = weights;
            state.weightsKey = weightsKey;
        }

        win.begin(context.idx);
        win.push(context.idx, Series.from(source).get(0), period, BACKFILL_FROM_SOURCE, source);

        if (win.size < period) {
            // Not enough data yet
            return NaN;
        }

        // weights[0] applies to the oldest value of the window, weights[period - 1] to the newest
        const weights: number[] = state.weights;
        const t = win.t!;
        let alma = 0;
        if (t.rebuilt) {
            for (let i = 0; i < period; i++) alma += weights[i] * t.values![period - 1 - i];
        } else {
            // the current value is not in the committed ring yet
            const ring = win.ring;
            for (let i = 0; i < period - 1; i++) alma += weights[i] * ring.at(period - 2 - i);
            alma += weights[period - 1] * t.x;
        }

        return context.precision(alma);
    };
}
