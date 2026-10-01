// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { Context } from '../../../Context.class';
import { checkPercentage, isNa } from '../utils';

const METHOD = 'array.percentile_linear_interpolation';

export function percentile_linear_interpolation(context: Context) {
    return (id: PineArrayObject, percentage: number): number => {
        if (isNa(percentage)) return NaN;
        checkPercentage(percentage, METHOD);

        const array = id.array;
        const len = array.length;
        if (len === 0) return NaN;

        // Sorted with na elements last; positions are taken over the whole array, na included.
        const sorted: number[] = [];
        for (let i = 0; i < len; i++) {
            const val = array[i];
            if (!isNa(val)) sorted.push(Number(val));
        }
        const hasNa = sorted.length < len;
        sorted.sort((a, b) => a - b);
        while (sorted.length < len) sorted.push(NaN);

        // Hazen plotting position: k = p/100 * N - 0.5 (multiplied first, as TradingView does, so that e.g.
        // p = 50/3 with N = 3 lands exactly on k = 0)
        const k = (percentage * len) / 100 - 0.5;

        // Handle boundaries
        if (k <= 0) return context.precision(sorted[0]);
        if (k >= len - 1) return context.precision(sorted[len - 1]);

        const i = Math.floor(k);
        const f = k - i;
        if (f === 0) return context.precision(sorted[i]);
        // TradingView's interpolated result is na whenever the array holds an na, even between two values.
        if (hasNa) return NaN;

        return context.precision(sorted[i] * (1 - f) + sorted[i + 1] * f);
    };
}
