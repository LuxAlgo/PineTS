// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { matrixStore } from '../capacity';

export function diff(context: Context) {
    return (id: PineMatrixObject, id2: PineMatrixObject | number) => {
        const idRows = matrixStore(id);
        const rows = idRows.length;
        if (rows === 0) return new PineMatrixObject(0, 0, NaN, context);
        const cols = idRows[0].length;

        const newMatrix = new PineMatrixObject(rows, cols, NaN, context);
        const newMatrixRows = matrixStore(newMatrix);

        if (id2 instanceof PineMatrixObject) {
            const id2Rows = matrixStore(id2);
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    const v1 = idRows[i][j];
                    const v2 = id2Rows[i] && id2Rows[i][j] !== undefined ? id2Rows[i][j] : NaN;
                    newMatrixRows[i][j] = v1 - v2;
                }
            }
        } else {
            const scalar = id2 as number;
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    newMatrixRows[i][j] = idRows[i][j] - scalar;
                }
            }
        }

        return newMatrix;
    };
}
