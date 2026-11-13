// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { matrixStore } from '../capacity';

export function is_symmetric(context: Context) {
    return (id: PineMatrixObject) => {
        const idRows = matrixStore(id);
        const rows = idRows.length;
        if (rows === 0) return false;
        const cols = idRows[0].length;
        if (rows !== cols) return false;
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < i; j++) {
                if (idRows[i][j] !== idRows[j][i]) return false;
            }
        }
        return true;
    };
}

