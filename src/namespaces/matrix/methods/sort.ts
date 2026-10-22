// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { order } from '../../Types';
import { sortedIndices, sortValueReader } from '../../array/utils';

export function sort(context: Context) {
    return (id: PineMatrixObject, column: number = 0, _order: order = order.ascending, sort_field?: string | number) => {
        if (id.matrix.length === 0) return;
        const keys = id.matrix.map((row) => row[column]);
        const read = sortValueReader(keys, sort_field);
        const rows = sortedIndices(read ? keys.map(read) : keys, _order).map((i) => id.matrix[i]);
        id.matrix.splice(0, rows.length, ...rows);
    };
}
