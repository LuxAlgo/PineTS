// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { assertMatrixIndex } from '../indexValidation';

export function submatrix(context: Context) {
    return (id: PineMatrixObject, from_row: number, to_row: number, from_col: number, to_col: number) => {
        const sourceRows = id.matrix.length;
        const sourceCols = sourceRows > 0 ? id.matrix[0].length : 0;
        assertMatrixIndex(from_row, sourceRows, 'row', 'matrix.submatrix', true);
        assertMatrixIndex(to_row, sourceRows, 'row', 'matrix.submatrix', true);
        assertMatrixIndex(from_col, sourceCols, 'column', 'matrix.submatrix', true);
        assertMatrixIndex(to_col, sourceCols, 'column', 'matrix.submatrix', true);
        const rows = to_row - from_row;
        const cols = to_col - from_col;

        const newMatrix = new PineMatrixObject(rows, cols, NaN, context);

        for (let i = 0; i < rows; i++) {
            const sourceRow = from_row + i;
            if (sourceRow >= id.matrix.length) break;

            for (let j = 0; j < cols; j++) {
                const sourceCol = from_col + j;
                if (sourceCol >= id.matrix[sourceRow].length) break;

                newMatrix.matrix[i][j] = id.matrix[sourceRow][sourceCol];
            }
        }

        return newMatrix;
    };
}
