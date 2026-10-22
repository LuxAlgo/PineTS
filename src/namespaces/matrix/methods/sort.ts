// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { order } from '../../Types';
import { sortedIndices, sortValueReader } from '../../array/utils';
import { assertMatrixIndex } from '../indexValidation';

export function sort(context: Context) {
    return (id: PineMatrixObject, column: number = 0, _order: order = order.ascending, sort_field?: string | number) => {
        const rows = id.matrix.length;
        const cols = rows > 0 ? id.matrix[0].length : 0;
        if (cols === 0 && column === 0) return;
        assertMatrixIndex(column, cols, 'column', 'matrix.sort');
        const keys = id.matrix.map((row) => row[column]);
        const read = sortValueReader(keys, sort_field);
        const sortedRows = sortedIndices(read ? keys.map(read) : keys, _order).map((i) => id.matrix[i]);
        id.matrix.splice(0, sortedRows.length, ...sortedRows);
    };
}
