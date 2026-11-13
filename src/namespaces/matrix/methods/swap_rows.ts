// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { assertMatrixIndex } from '../indexValidation';
import { matrixRestructured, matrixStore } from '../capacity';

export function swap_rows(context: Context) {
    return (id: PineMatrixObject, row1: number, row2: number) => {
        const store = matrixStore(id);
        const rows = store.length;
        assertMatrixIndex(row1, rows, 'row', 'matrix.swap_rows');
        assertMatrixIndex(row2, rows, 'row', 'matrix.swap_rows');
        // Both rows already belong to the matrix: swapping them changes no dimension.
        const temp = store[row1];
        store[row1] = store[row2];
        store[row2] = temp;
        matrixRestructured(store);
    };
}

