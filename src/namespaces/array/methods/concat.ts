// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { isArrayOfType } from '../utils';
import { arrayStore, chargeArrayGrowth, preflightArrayGrowth } from '../capacity';

export function concat(context: any) {
    return (id: PineArrayObject, other: PineArrayObject): PineArrayObject => {
        // Snapshot first, including the self-concatenation case, and preflight
        // the whole append before changing a single element.
        const values = Array.from(arrayStore(other));
        const store = arrayStore(id);
        preflightArrayGrowth(store, values.length, context, 'array.concat');
        chargeArrayGrowth(store, values.length, context);
        for (const value of values) store.push(value);
        return id;
    };
}
