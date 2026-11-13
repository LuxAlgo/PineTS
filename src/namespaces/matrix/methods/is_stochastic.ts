// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { matrixStore } from '../capacity';

export function is_stochastic(context: Context) {
    return (id: PineMatrixObject) => {
        const idRows = matrixStore(id);
        const rows = idRows.length;
        if (rows === 0) return false;
        const cols = idRows[0].length;
        
        for (let i = 0; i < rows; i++) {
            let sum = 0;
            for (let j = 0; j < cols; j++) {
                const val = idRows[i][j];
                if (val < 0) return false; // Non-negative entries
                sum += val;
            }
            // Row sum must be 1 (approximately)
            if (Math.abs(sum - 1) > 1e-10) return false;
        }
        return true;
    };
}

