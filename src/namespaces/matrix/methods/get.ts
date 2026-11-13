// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { assertMatrixIndex } from '../indexValidation';

export function get(context: Context) {
    return (id: PineMatrixObject, row: number, col: number) => {
        const rows = id.matrix.length;
        const cols = rows > 0 ? id.matrix[0].length : 0;
        assertMatrixIndex(row, rows, 'row', 'matrix.get');
        assertMatrixIndex(col, cols, 'column', 'matrix.get');
        const val = id.matrix[row][col];
        return val === undefined ? NaN : val;
    };
}
