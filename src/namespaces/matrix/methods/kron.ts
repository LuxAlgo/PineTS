// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { assertMatrixDimensions, chargeCollectionWork } from '../../collectionCapacity';

export function kron(context: Context) {
    return (id: PineMatrixObject, id2: PineMatrixObject) => {
        const r1 = id.matrix.length;
        const c1 = r1 > 0 ? id.matrix[0].length : 0;
        const r2 = id2.matrix.length;
        const c2 = r2 > 0 ? id2.matrix[0].length : 0;

        const rows = r1 * r2;
        const cols = c1 * c2;

        chargeCollectionWork(context, assertMatrixDimensions(rows, cols, 'matrix.kron'), 'matrix.kron');
        const newMatrix = new PineMatrixObject(rows, cols, NaN, context);

        for (let i = 0; i < r1; i++) {
            for (let j = 0; j < c1; j++) {
                const val1 = id.matrix[i][j];
                for (let k = 0; k < r2; k++) {
                    for (let l = 0; l < c2; l++) {
                        const val2 = id2.matrix[k][l];
                        newMatrix.matrix[i * r2 + k][j * c2 + l] = val1 * val2;
                    }
                }
            }
        }

        return newMatrix;
    };
}
