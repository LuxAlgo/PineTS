// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';

/**
 * Gauss-Jordan elimination to compute the inverse of an NxN matrix.
 * Uses partial pivoting for numerical stability.
 * Returns a matrix of NaN if the matrix is singular.
 */
function inverse(matrix: number[][]): number[][] {
    const n = matrix.length;
    if (n === 0) return [];

    // Build augmented matrix [A | I]
    const aug: number[][] = new Array(n);
    for (let i = 0; i < n; i++) {
        aug[i] = new Array(2 * n);
        for (let j = 0; j < n; j++) {
            aug[i][j] = matrix[i][j];
        }
        for (let j = 0; j < n; j++) {
            aug[i][n + j] = i === j ? 1 : 0;
        }
    }

    // Forward elimination with partial pivoting
    for (let col = 0; col < n; col++) {
        // Find pivot (row with largest absolute value in this column)
        let maxVal = Math.abs(aug[col][col]);
        let maxRow = col;
        for (let row = col + 1; row < n; row++) {
            const absVal = Math.abs(aug[row][col]);
            if (absVal > maxVal) {
                maxVal = absVal;
                maxRow = row;
            }
        }

        // If pivot is zero (or near-zero), matrix is singular
        if (maxVal < 1e-14) {
            return matrix.map((r) => r.map(() => NaN));
        }

        // Swap rows if necessary
        if (maxRow !== col) {
            const temp = aug[col];
            aug[col] = aug[maxRow];
            aug[maxRow] = temp;
        }

        // Scale pivot row
        const pivot = aug[col][col];
        for (let j = col; j < 2 * n; j++) {
            aug[col][j] /= pivot;
        }

        // Eliminate column in all other rows
        for (let row = 0; row < n; row++) {
            if (row === col) continue;
            const factor = aug[row][col];
            if (factor === 0) continue;
            for (let j = col; j < 2 * n; j++) {
                aug[row][j] -= factor * aug[col][j];
            }
        }
    }

    // Extract inverse from right half of augmented matrix
    const result: number[][] = new Array(n);
    for (let i = 0; i < n; i++) {
        result[i] = new Array(n);
        for (let j = 0; j < n; j++) {
            result[i][j] = aug[i][n + j];
        }
    }
    return result;
}

export { inverse };

export function inv(context: Context) {
    return (id: PineMatrixObject) => {
        const rows = id.matrix.length;
        const cols = rows > 0 ? id.matrix[0].length : 0;
        if (rows !== cols) return new PineMatrixObject(rows, cols, NaN, context);

        const invMat = inverse(id.matrix);
        const newMatrix = new PineMatrixObject(rows, cols, NaN, context);
        newMatrix.matrix = invMat;
        return newMatrix;
    };
}
