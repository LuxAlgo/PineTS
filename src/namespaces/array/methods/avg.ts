// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { Context } from '../../../Context.class';
import { arrayStore } from '../capacity';

export function avg(context: Context) {
    return (id: PineArrayObject): number => {
        const plain = arrayStore(id);
        let mean = 0;
        let count = 0;
        for (const item of plain) {
            const val = Number(item);
            if (!isNaN(val)) {
                count++;
                mean += (val - mean) / count;
            }
        }
        if (count === 0) return NaN;
        return context.precision(mean);
    };
}
