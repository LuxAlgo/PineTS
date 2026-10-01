// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { order } from '../../Types';
import { sortPlainValues, sortValueReader, sortedIndices } from '../utils';

export function sort(context: any) {
    return (id: PineArrayObject, _order: order = order.ascending, sort_field?: string | number): void => {
        const arr = id.array;
        const values = Array.from(arr);
        const key = sortValueReader(values, sort_field);
        const sorted = key ? sortedIndices(values.map(key), _order).map((i) => values[i]) : sortPlainValues(values, _order);
        // Written back element by element so that a slice view sorts its window of the parent in place.
        for (let i = 0; i < sorted.length; i++) arr[i] = sorted[i];
    };
}
