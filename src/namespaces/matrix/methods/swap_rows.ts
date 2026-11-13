// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { assertMatrixIndex } from '../indexValidation';

export function swap_rows(context: Context) {
    return (id: PineMatrixObject, row1: number, row2: number) => {
        const rows = id.matrix.length;
        assertMatrixIndex(row1, rows, 'row', 'matrix.swap_rows');
        assertMatrixIndex(row2, rows, 'row', 'matrix.swap_rows');
        const temp = id.matrix[row1];
        id.matrix[row1] = id.matrix[row2];
        id.matrix[row2] = temp;
    };
}

