// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';

export function median(context: any) {
    return (id: PineArrayObject) => {
        const arr = id.array;
        if (arr.length === 0) return NaN;

        // Sort a copy (unavoidable for median — need the middle element(s))
        const sorted = new Array(arr.length);
        for (let i = 0; i < arr.length; i++) sorted[i] = arr[i];
        sorted.sort((a: number, b: number) => a - b);

        const mid = Math.floor(sorted.length / 2);

        if (sorted.length % 2 !== 0) {
            return sorted[mid];
        }

        return (sorted[mid - 1] + sorted[mid]) / 2;
    };
}
