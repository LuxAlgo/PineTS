// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { matrixStore } from '../capacity';

export function avg(context: Context) {
    return (id: PineMatrixObject) => {
        const idRows = matrixStore(id);
        const rows = idRows.length;
        if (rows === 0) return NaN;
        const cols = idRows[0].length;
        if (cols === 0) return NaN;
        
        let sum = 0;
        let count = 0;
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const val = idRows[i][j];
                if (!isNaN(val)) {
                    sum += val;
                    count++;
                }
            }
        }
        
        if (count === 0) return NaN;
        return sum / count;
    };
}

