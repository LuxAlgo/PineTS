// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { matrixStore } from '../capacity';

export function min(context: Context) {
    return (id: PineMatrixObject) => {
        const idRows = matrixStore(id);
        const rows = idRows.length;
        if (rows === 0) return NaN;
        const cols = idRows[0].length;
        
        let minVal = Infinity;
        let found = false;
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const val = idRows[i][j];
                if (!isNaN(val)) {
                    if (val < minVal) minVal = val;
                    found = true;
                }
            }
        }
        
        return found ? minVal : NaN;
    };
}

