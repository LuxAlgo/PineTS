// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { assertMatrixIndex } from '../indexValidation';
import { matrixStore } from '../capacity';

export function submatrix(context: Context) {
    return (id: PineMatrixObject, from_row?: number, to_row?: number, from_col?: number, to_col?: number) => {
        const idRows = matrixStore(id);
        const sourceRows = idRows.length;
        const sourceCols = sourceRows > 0 ? idRows[0].length : 0;
        // Every bound is optional: the default range is the whole matrix.
        from_row ??= 0;
        to_row ??= sourceRows;
        from_col ??= 0;
        to_col ??= sourceCols;
        assertMatrixIndex(from_row, sourceRows, 'row', 'matrix.submatrix', true);
        assertMatrixIndex(to_row, sourceRows, 'row', 'matrix.submatrix', true);
        assertMatrixIndex(from_col, sourceCols, 'column', 'matrix.submatrix', true);
        assertMatrixIndex(to_col, sourceCols, 'column', 'matrix.submatrix', true);
        const rows = to_row - from_row;
        const cols = to_col - from_col;

        const newMatrix = new PineMatrixObject(rows, cols, NaN, context);
        const newMatrixRows = matrixStore(newMatrix);

        for (let i = 0; i < rows; i++) {
            const sourceRow = from_row + i;
            if (sourceRow >= idRows.length) break;

            for (let j = 0; j < cols; j++) {
                const sourceCol = from_col + j;
                if (sourceCol >= idRows[sourceRow].length) break;

                newMatrixRows[i][j] = idRows[sourceRow][sourceCol];
            }
        }

        return newMatrix;
    };
}
