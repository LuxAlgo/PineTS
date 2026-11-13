// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { isArrayOfType } from '../utils';
import { preflightArrayGrowth } from '../capacity';

export function concat(context: any) {
    return (id: PineArrayObject, other: PineArrayObject): PineArrayObject => {
        // Snapshot first, including the self-concatenation case, and preflight
        // the whole append before changing a single element.
        const values = Array.from(other.array);
        preflightArrayGrowth(id.array, values.length, context, 'array.concat');
        for (const value of values) id.array.push(value);
        return id;
    };
}
