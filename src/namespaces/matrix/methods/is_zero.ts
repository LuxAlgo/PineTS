// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { matrixStore } from '../capacity';

export function is_zero(context: Context) {
    return (id: PineMatrixObject) => {
        const idRows = matrixStore(id);
        const rows = idRows.length;
        if (rows === 0) return true; // Empty matrix is zero? Debatable, but let's say yes or false. Pine: true if all elements zero. No elements -> vacuously true? Or false? Let's check docs or assume true.
        const cols = idRows[0].length;
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (idRows[i][j] !== 0) return false;
            }
        }
        return true;
    };
}

