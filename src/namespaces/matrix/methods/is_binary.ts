// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { matrixStore } from '../capacity';

export function is_binary(context: Context) {
    return (id: PineMatrixObject) => {
        const idRows = matrixStore(id);
        const rows = idRows.length;
        if (rows === 0) return false;
        const cols = idRows[0].length;
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const val = idRows[i][j];
                if (val !== 0 && val !== 1) return false;
            }
        }
        return true;
    };
}

