// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { isNa } from '../utils';
import { arrayStore } from '../capacity';

export function median(context: any) {
    return (id: PineArrayObject) => {
        const plain = arrayStore(id);
        // Median of the non-na elements
        const sorted = plain.filter((v: any) => !isNa(v)).sort((a: number, b: number) => a - b);
        if (sorted.length === 0) return NaN;

        const mid = Math.floor(sorted.length / 2);

        if (sorted.length % 2 !== 0) {
            return sorted[mid];
        }

        return (sorted[mid - 1] + sorted[mid]) / 2;
    };
}
