// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';

export function percentile_nearest_rank(context: any) {
    return (id: PineArrayObject, percentage: number): number => {
        const array = id.array;
        const totalCount = array.length;
        if (totalCount === 0) return NaN;

        // Single pass: validate and copy
        const validValues = new Array<number>();
        for (let i = 0; i < totalCount; i++) {
            const val = Number(array[i]);
            if (!isNaN(val) && val !== null && val !== undefined) {
                validValues.push(val);
            }
        }

        if (validValues.length === 0) return NaN;

        validValues.sort((a, b) => a - b);

        if (percentage < 0) percentage = 0;
        if (percentage > 100) percentage = 100;

        // Nearest Rank Method
        // Use total array length (including NaNs) for calculation to match Pine Script behavior
        // observed in tests where NaNs dilute the percentile rank.
        const rank = Math.ceil((percentage / 100) * totalCount);

        if (rank <= 0) {
            return validValues[0];
        }

        if (rank > validValues.length) return NaN;

        return validValues[rank - 1];
    };
}
