// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { assertMatrixIndex } from '../indexValidation';

export function set(context: Context) {
    return (id: PineMatrixObject, row: number, col: number, value: any) => {
        const rows = id.matrix.length;
        const cols = rows > 0 ? id.matrix[0].length : 0;
        assertMatrixIndex(row, rows, 'row', 'matrix.set');
        assertMatrixIndex(col, cols, 'column', 'matrix.set');
        id.matrix[row][col] = value;
    };
}
