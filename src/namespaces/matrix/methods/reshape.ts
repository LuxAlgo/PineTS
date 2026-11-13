// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { PineRuntimeError } from '../../../errors/PineRuntimeError';
import { assertMatrixDimensions, chargeCollectionAllocation, chargeCollectionWork } from '../../collectionCapacity';

export function reshape(context: Context) {
    return (id: PineMatrixObject, rows: number, cols: number) => {
        const currentRows = id.matrix.length;
        const currentCols = currentRows > 0 ? id.matrix[0].length : 0;
        const currentSize = currentRows * currentCols;
        const newSize = assertMatrixDimensions(rows, cols, 'matrix.reshape');

        if (currentSize !== newSize) {
            throw new PineRuntimeError('The new matrix dimensions must preserve the number of elements.', 'matrix.reshape');
        }
        chargeCollectionWork(context, newSize, 'matrix.reshape');
        chargeCollectionAllocation(context, newSize, 'matrix.reshape');

        const elements: any[] = [];
        for (let i = 0; i < currentRows; i++) {
            for (let j = 0; j < currentCols; j++) {
                elements.push(id.matrix[i][j]);
            }
        }

        const newMatrix: any[][] = [];
        let k = 0;
        for (let i = 0; i < rows; i++) {
            const row: any[] = [];
            for (let j = 0; j < cols; j++) {
                row.push(elements[k++]);
            }
            newMatrix.push(row);
        }

        id.matrix = newMatrix;
    };
}
