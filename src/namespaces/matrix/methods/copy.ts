// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { matrixStore } from '../capacity';

export function copy(context: Context) {
    return (id: PineMatrixObject) => {
        const source = matrixStore(id);
        const rows = source.length;
        const cols = rows > 0 ? source[0].length : 0;
        const newMatrix = new PineMatrixObject(rows, cols, NaN, context);

        // Deep copy the array of arrays structure. Assigning `matrix` validates and charges it.
        newMatrix.matrix = source.map((row) => [...row]);
        return newMatrix;
    };
}
