// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { Context } from '../../../Context.class';
import { arrayStore } from '../capacity';

export function covariance(context: Context) {
    return (arr1: PineArrayObject, arr2: PineArrayObject, biased: boolean = true): number => {
        const a1 = arrayStore(arr1);
        const a2 = arrayStore(arr2);

        if (a1.length !== a2.length) return NaN;

        let sum1 = 0;
        let sum2 = 0;
        let count = 0;
        const validIndices: number[] = [];

        // First pass: Identify valid pairs and calculate sums for means
        for (let i = 0; i < a1.length; i++) {
            const v1 = Number(a1[i]);
            const v2 = Number(a2[i]);

            if (!isNaN(v1) && v1 !== null && v1 !== undefined && !isNaN(v2) && v2 !== null && v2 !== undefined) {
                sum1 += v1;
                sum2 += v2;
                count++;
                validIndices.push(i);
            }
        }

        if (count === 0) return NaN;

        const mean1 = sum1 / count;
        const mean2 = sum2 / count;
        let sumProd = 0;

        // Second pass: Calculate sum of products of differences
        for (const i of validIndices) {
            const v1 = Number(a1[i]);
            const v2 = Number(a2[i]);
            sumProd += (v1 - mean1) * (v2 - mean2);
        }

        const divisor = biased ? count : count - 1;
        if (divisor <= 0) return NaN;

        return context.precision(sumProd / divisor);
    };
}
