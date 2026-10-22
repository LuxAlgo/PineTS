// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { assertMatrixIndex } from '../indexValidation';

export function fill(context: Context) {
    return (id: PineMatrixObject, value: any, from_row?: number, to_row?: number, from_col?: number, to_col?: number) => {
        const rows = id.matrix.length;
        const cols = rows > 0 ? id.matrix[0].length : 0;

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
                id.matrix[i][j] = value;
            }
        }
    };
}

