// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { matrixStore } from '../capacity';

export function rank(context: Context) {
    return (id: PineMatrixObject) => {
        // Rank calculation placeholder
        // Requires Gaussian elimination to row echelon form
        const source = matrixStore(id);
        const rows = source.length;
        if (rows === 0) return 0;
        const cols = source[0].length;
        
        let rank = 0;
        const mat = source.map(r => [...r]); // clone
        
        // Very basic Gaussian elimination count
        // For full accuracy need proper numerical stability
        // This is a simplified version
        let r = 0;
        for (let c = 0; c < cols && r < rows; c++) {
            let pivot = r;
            while (pivot < rows && Math.abs(mat[pivot][c]) < 1e-10) pivot++;
            
            if (pivot < rows) {
                [mat[r], mat[pivot]] = [mat[pivot], mat[r]];
                
                const val = mat[r][c];
                for (let j = c; j < cols; j++) mat[r][j] /= val;
                
                for (let i = 0; i < rows; i++) {
                    if (i !== r) {
                        const factor = mat[i][c];
                        for (let j = c; j < cols; j++) mat[i][j] -= factor * mat[r][j];
                    }
                }
                r++;
            }
        }
        return r;
    };
}

