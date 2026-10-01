// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { isNa, isValueOfType, outOfBounds } from '../utils';
import { Context } from '../../../Context.class';

export function fill(context: Context) {
    return (id: PineArrayObject, value: any, index_from: number = 0, index_to?: number): void => {
        const size = id.array.length;
        const from = isNa(index_from) ? 0 : index_from;
        const to = index_to === undefined || isNa(index_to) ? size : index_to;
        // `from` must address an element (so filling an empty array is an error); `from > to` fills nothing.
        if (from < 0 || from >= size) outOfBounds(from, size, 'array.fill');
        if (to < 0 || to > size) outOfBounds(to, size, 'array.fill');
        if (!isValueOfType(value, id.type)) {
            throw new Error(
                `Cannot call 'array.fill' with argument 'value'='${value}'. An argument of 'literal ${typeof value}' type was used but a '${
                    id.type
                }' is expected.`
            );
        }
        const v = typeof value === 'number' ? context.precision(value) : value;
        for (let i = from; i < to; i++) id.array[i] = v;
    };
}
