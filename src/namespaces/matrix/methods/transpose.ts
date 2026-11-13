// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { matrixStore } from '../capacity';

export function transpose(context: Context) {
    return (id: PineMatrixObject) => {
        const idRows = matrixStore(id);
        const rows = idRows.length;
        if (rows === 0) return new PineMatrixObject(0, 0, NaN, context);
        const cols = idRows[0].length;

        const newMatrix = new PineMatrixObject(cols, rows, NaN, context);
        const newMatrixRows = matrixStore(newMatrix);

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                newMatrixRows[j][i] = idRows[i][j];
            }
        }

        return newMatrix;
    };
}
