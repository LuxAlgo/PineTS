// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { isNa, outOfBounds } from '../utils';

export function max(context: any) {
    return (id: PineArrayObject, nth: number = 0): number => {
        const arr = id.array;
        const size = arr.length;
        if (size === 0) return context.NA;
        if (isNa(nth)) nth = 0;
        if (nth < 0 || nth >= size) outOfBounds(nth, size, 'array.max');

        // Fast path: nth=0 (most common) — O(N) linear scan instead of O(N log N) sort
        if (nth === 0) {
            let maxVal = NaN;
            for (let i = 0; i < size; i++) {
                const v = arr[i];
                if (!isNa(v) && !(v <= maxVal)) maxVal = v;
            }
            return maxVal;
        }

        // na elements are skipped; an nth past the last non-na value returns the smallest one.
        const sorted = arr.filter((v: any) => !isNa(v)).sort((a: number, b: number) => b - a);
        return sorted.length ? sorted[Math.min(nth, sorted.length - 1)] : context.NA;
    };
}
