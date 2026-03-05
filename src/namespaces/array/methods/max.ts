// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';

export function max(context: any) {
    return (id: PineArrayObject, nth: number = 0): number => {
        const arr = id.array;
        if (arr.length === 0) return context.NA;

        // Fast path: nth=0 (most common) — O(N) linear scan instead of O(N log N) sort
        if (nth === 0) {
            let maxVal = arr[0];
            for (let i = 1; i < arr.length; i++) {
                if (arr[i] > maxVal) maxVal = arr[i];
            }
            return maxVal ?? context.NA;
        }

        // nth > 0: need sorted order — still requires O(N log N)
        const sorted = [...arr].sort((a, b) => b - a);
        return sorted[nth] ?? context.NA;
    };
}
