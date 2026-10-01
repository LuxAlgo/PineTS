// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { Context } from '../../../Context.class';

export function stdev(context: Context) {
    return (id: PineArrayObject, biased: boolean = true): number => {
        const array = id.array;
        const n_total = array.length;

        if (n_total === 0) return NaN;

        let sum = 0;
        let sumSq = 0;
        let count = 0;

        for (let i = 0; i < n_total; i++) {
            const val = Number(array[i]);
            if (!isNaN(val) && val !== null && val !== undefined) {
                sum += val;
                sumSq += val * val;
                count++;
            }
        }

        if (count === 0) return NaN;

        const mean = sum / count;
        const meanSq = sumSq / count;

        // Naive variance formula: E[x^2] - (E[x])^2
        // This matches Pine Script's implementation which is prone to FP noise
        let variance = meanSq - mean * mean;

        // Do NOT clamp to 0. Pine Script seems to propagate negative variance as NaN stdev.
        if (variance < 0) return NaN;

        if (!biased && count > 1) {
            variance = (variance * count) / (count - 1);
        }

        if (!biased && count === 1) return NaN;

        return context.precision(Math.sqrt(variance));
    };
}
