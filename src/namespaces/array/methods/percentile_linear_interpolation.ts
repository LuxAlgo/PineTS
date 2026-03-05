// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { Context } from '../../../Context.class';

export function percentile_linear_interpolation(context: Context) {
    return (id: PineArrayObject, percentage: number): number => {
        const array = id.array;
        const len = array.length;
        if (len === 0) return NaN;

        // Validate and copy in a single pass (avoid separate validValues allocation)
        const sorted = new Array(len);
        for (let i = 0; i < len; i++) {
            const val = Number(array[i]);
            if (isNaN(val) || val === null || val === undefined) {
                return NaN; // Propagate NaN if any value is invalid
            }
            sorted[i] = val;
        }

        sorted.sort((a: number, b: number) => a - b);

        if (percentage < 0) percentage = 0;
        if (percentage > 100) percentage = 100;

        // Pine Script seems to use the formula: k = (p/100) * N - 0.5
        // This corresponds to the Hazen plotting position definition.
        const k = (percentage / 100) * len - 0.5;

        // Handle boundaries
        if (k <= 0) return context.precision(sorted[0]);
        if (k >= len - 1) return context.precision(sorted[len - 1]);

        const i = Math.floor(k);
        const f = k - i;

        return context.precision(sorted[i] * (1 - f) + sorted[i + 1] * f);
    };
}
