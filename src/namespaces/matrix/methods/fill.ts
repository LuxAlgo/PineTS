// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { assertMatrixIndex } from '../indexValidation';
import { matrixStore } from '../capacity';

export function fill(context: Context) {
    return (id: PineMatrixObject, value: any, from_row?: number, to_row?: number, from_col?: number, to_col?: number) => {
        const idRows = matrixStore(id);
        const rows = idRows.length;
        const cols = rows > 0 ? idRows[0].length : 0;

        const r1 = from_row !== undefined ? from_row : 0;
        const r2 = to_row !== undefined ? to_row : rows;
        const c1 = from_col !== undefined ? from_col : 0;
        const c2 = to_col !== undefined ? to_col : cols;

        assertMatrixIndex(r1, rows, 'row', 'matrix.fill', true);
        assertMatrixIndex(r2, rows, 'row', 'matrix.fill', true);
        assertMatrixIndex(c1, cols, 'column', 'matrix.fill', true);
        assertMatrixIndex(c2, cols, 'column', 'matrix.fill', true);

        for (let i = r1; i < r2; i++) {
            if (i >= rows) break;
            for (let j = c1; j < c2; j++) {
                if (j >= cols) break;
                idRows[i][j] = value;
            }
        }
    };
}

