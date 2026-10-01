// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject, PineArrayType } from '../PineArrayObject';
import { order } from '../../Types';
import { sortValueReader, sortedIndices } from '../utils';

export function sort_indices(context: any) {
    return (id: PineArrayObject, _order: order = order.ascending, sort_field?: string | number): PineArrayObject => {
        const values = Array.from(id.array);
        const key = sortValueReader(values, sort_field);
        return new PineArrayObject(sortedIndices(key ? values.map(key) : values, _order), PineArrayType.int, context);
    };
}
