// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { order } from '../../Types';
import { sortedIndices, sortValueReader } from '../../array/utils';
import { assertMatrixIndex } from '../indexValidation';
import { matrixRestructured, matrixStore } from '../capacity';

export function sort(context: Context) {
    return (id: PineMatrixObject, column: number = 0, _order: order = order.ascending, sort_field?: string | number) => {
        const store = matrixStore(id);
        const rows = store.length;
        const cols = rows > 0 ? store[0].length : 0;
        if (cols === 0 && column === 0) return;
        assertMatrixIndex(column, cols, 'column', 'matrix.sort');
        const keys = store.map((row) => row[column]);
        const read = sortValueReader(keys, sort_field);
        // A permutation of the matrix's own rows: no dimension changes.
        const sortedRows = sortedIndices(read ? keys.map(read) : keys, _order).map((i) => store[i]);
        for (let i = 0; i < sortedRows.length; i++) store[i] = sortedRows[i];
        matrixRestructured(store);
    };
}
