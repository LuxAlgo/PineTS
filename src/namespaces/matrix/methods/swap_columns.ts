// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { assertMatrixIndex } from '../indexValidation';
import { matrixStore } from '../capacity';

export function swap_columns(context: Context) {
    return (id: PineMatrixObject, col1: number, col2: number) => {
        const idRows = matrixStore(id);
        const rows = idRows.length;
        const cols = rows > 0 ? idRows[0].length : 0;
        assertMatrixIndex(col1, cols, 'column', 'matrix.swap_columns');
        assertMatrixIndex(col2, cols, 'column', 'matrix.swap_columns');
        for (let i = 0; i < rows; i++) {
            const temp = idRows[i][col1];
            idRows[i][col1] = idRows[i][col2];
            idRows[i][col2] = temp;
        }
    };
}

