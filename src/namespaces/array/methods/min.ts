// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';

export function min(context: any) {
    return (id: PineArrayObject, nth: number = 0): number => {
        const arr = id.array;
        if (arr.length === 0) return context.NA;

        // Fast path: nth=0 (most common) — O(N) linear scan instead of O(N log N) sort
        if (nth === 0) {
            let minVal = arr[0];
            for (let i = 1; i < arr.length; i++) {
                if (arr[i] < minVal) minVal = arr[i];
            }
            return minVal ?? context.NA;
        }

        // nth > 0: need sorted order — still requires O(N log N)
        const sorted = [...arr].sort((a, b) => a - b);
        return sorted[nth] ?? context.NA;
    };
}
