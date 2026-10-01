// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { isNa, outOfBounds } from '../utils';

export function percentrank(context: any) {
    return (id: PineArrayObject, index: number): number => {
        const size = id.array.length;
        if (size === 0) return NaN;
        if (index < 0 || index >= size) outOfBounds(index, size, 'array.percentrank');

        const value = id.array[Math.floor(index)];
        if (isNa(value)) return NaN;

        // Elements <= the reference value, the reference itself excluded, over size - 1 (na elements count
        // in the size but never in the numerator).
        let atOrBelow = 0;
        for (const item of id.array) {
            if (!isNa(item) && item <= value) atOrBelow++;
        }

        const divisor = size - 1;
        if (divisor <= 0) return NaN;

        return ((atOrBelow - 1) / divisor) * 100;
    };
}
