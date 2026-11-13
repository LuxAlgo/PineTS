// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { assertMatrixIndex } from '../indexValidation';
import { matrixStore } from '../capacity';

export function get(context: Context) {
    return (id: PineMatrixObject, row: number, col: number) => {
        const idRows = matrixStore(id);
        const rows = idRows.length;
        const cols = rows > 0 ? idRows[0].length : 0;
        assertMatrixIndex(row, rows, 'row', 'matrix.get');
        assertMatrixIndex(col, cols, 'column', 'matrix.get');
        const val = idRows[row][col];
        return val === undefined ? NaN : val;
    };
}
