// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { matrixStore } from '../capacity';

// Simple determinant calculation using Gaussian elimination
function determinant(matrix: number[][]): number {
    const n = matrix.length;
    if (n === 0) return 0;
    if (n === 1) return matrix[0][0];
    if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];

    // Clone to avoid modifying original
    const mat = matrix.map(row => [...row]);
    let det = 1;

    for (let i = 0; i < n; i++) {
        let pivot = i;
        while (pivot < n && mat[pivot][i] === 0) pivot++;
        
        if (pivot === n) return 0; // Singular
        
        if (pivot !== i) {
            [mat[i], mat[pivot]] = [mat[pivot], mat[i]];
            det *= -1;
        }
        
        det *= mat[i][i];
        
        for (let j = i + 1; j < n; j++) {
            const factor = mat[j][i] / mat[i][i];
            for (let k = i; k < n; k++) {
                mat[j][k] -= factor * mat[i][k];
            }
        }
    }
    
    return det;
}

export function det(context: Context) {
    return (id: PineMatrixObject) => {
        const idRows = matrixStore(id);
        const rows = idRows.length;
        const cols = rows > 0 ? idRows[0].length : 0;
        if (rows !== cols) return NaN;
        
        return determinant(idRows);
    };
}

