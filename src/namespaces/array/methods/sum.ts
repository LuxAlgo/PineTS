// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { Context } from '../../../Context.class';

export function sum(context: Context) {
    return (id: PineArrayObject): number => {
        // Sum of the non-na elements; na when there are none (empty array included).
        let total = 0;
        let count = 0;
        for (const item of id.array) {
            const val = Number(item);
            if (!isNaN(val)) {
                total += val;
                count++;
            }
        }
        return count === 0 ? NaN : context.precision(total);
    };
}
