// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { nonNaWindow } from '../utils/nonNaWindow';

/**
 * Correlation Coefficient
 *
 * Describes the degree to which two series tend to deviate from their ta.sma() values.
 * r = (sma(x*y) - sma(x)*sma(y)) / sqrt((sma(x^2) - sma(x)^2) * (sma(y^2) - sma(y)^2))
 *
 * Each of the five averages skips its own na values, as TradingView computes it. When one series
 * has an na inside the window the averages cover different bars, so the result can fall outside
 * [-1, 1]; that is TradingView's value too.
 */
export function correlation(context: any) {
    return (source1: any, source2: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        const s1 = Series.from(source1);
        const s2 = Series.from(source2);
        const key = _callId || `correlation_${length}`;

        // Summed afresh rather than with the running sum: `mxx - mx * mx` cancels, so the drift of a
        // running sum can turn a zero variance negative (or the other way round).
        const mean = (suffix: string, valueAt: (k: number) => number) => {
            const w = nonNaWindow(context, `${key}_${suffix}`, valueAt, length);
            if (!w) return NaN;
            const values = w.values();
            let sum = 0;
            for (let i = 0; i < length; i++) sum += values[i];
            return sum / length;
        };
        const mx = mean('x', (k) => s1.get(k));
        const my = mean('y', (k) => s2.get(k));
        const mxy = mean('xy', (k) => s1.get(k) * s2.get(k));
        const mxx = mean('xx', (k) => s1.get(k) * s1.get(k));
        const myy = mean('yy', (k) => s2.get(k) * s2.get(k));
        if ([mx, my, mxy, mxx, myy].some((v) => Number.isNaN(v))) return NaN;

        const varX = mxx - mx * mx;
        const varY = myy - my * my;
        if (varX <= 0 || varY <= 0) return context.precision(0);

        return context.precision((mxy - mx * my) / Math.sqrt(varX * varY));
    };
}
