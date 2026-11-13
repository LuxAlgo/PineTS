// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { matrixStore } from '../capacity';

export function trace(context: Context) {
    return (id: PineMatrixObject) => {
        const idRows = matrixStore(id);
        const rows = idRows.length;
        if (rows === 0) return 0;
        const cols = idRows[0].length;
        const n = Math.min(rows, cols);
        
        let sum = 0;
        for (let i = 0; i < n; i++) {
            sum += idRows[i][i];
        }
        return sum;
    };
}

