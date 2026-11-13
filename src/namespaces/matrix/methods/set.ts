// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { assertMatrixIndex } from '../indexValidation';
import { matrixStore } from '../capacity';

export function set(context: Context) {
    return (id: PineMatrixObject, row: number, col: number, value: any) => {
        const idRows = matrixStore(id);
        const rows = idRows.length;
        const cols = rows > 0 ? idRows[0].length : 0;
        assertMatrixIndex(row, rows, 'row', 'matrix.set');
        assertMatrixIndex(col, cols, 'column', 'matrix.set');
        idRows[row][col] = value;
    };
}
