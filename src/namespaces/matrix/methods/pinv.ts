// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { inverse } from './inv';

/**
 * Moore-Penrose pseudoinverse.
 * - Square matrix: pinv(A) = inv(A)
 * - Tall matrix (m > n): pinv(A) = (A^T A)^-1 A^T
 * - Wide matrix (m < n): pinv(A) = A^T (A A^T)^-1
 */
export function pinv(context: Context) {
    return (id: PineMatrixObject) => {
        const m = id.matrix.length;
        if (m === 0) return new PineMatrixObject(0, 0, NaN, context);
        const n = id.matrix[0].length;

        if (m === n) {
            // Square matrix — pseudoinverse is just the regular inverse
            const invMat = inverse(id.matrix);
            const result = new PineMatrixObject(m, n, NaN, context);
            result.matrix = invMat;
            return result;
        }

        // Helper: transpose a raw 2D array
        const transposeRaw = (mat: number[][]): number[][] => {
            const rows = mat.length;
            const cols = mat[0].length;
            const t: number[][] = new Array(cols);
            for (let i = 0; i < cols; i++) {
                t[i] = new Array(rows);
                for (let j = 0; j < rows; j++) {
                    t[i][j] = mat[j][i];
                }
            }
            return t;
        };

        // Helper: multiply two raw 2D arrays
        const multiplyRaw = (a: number[][], b: number[][]): number[][] => {
            const aRows = a.length;
            const aCols = a[0].length;
            const bCols = b[0].length;
            const result: number[][] = new Array(aRows);
            for (let i = 0; i < aRows; i++) {
                result[i] = new Array(bCols).fill(0);
                for (let k = 0; k < aCols; k++) {
                    const aik = a[i][k];
                    if (aik === 0) continue;
                    for (let j = 0; j < bCols; j++) {
                        result[i][j] += aik * b[k][j];
                    }
                }
            }
            return result;
        };

        const A = id.matrix;
        const AT = transposeRaw(A);

        let pinvMat: number[][];
        if (m > n) {
            // Tall: pinv(A) = (A^T A)^-1 A^T
            const ATA = multiplyRaw(AT, A);       // n x n
            const ATAinv = inverse(ATA);           // n x n
            pinvMat = multiplyRaw(ATAinv, AT);     // n x m
        } else {
            // Wide: pinv(A) = A^T (A A^T)^-1
            const AAT = multiplyRaw(A, AT);        // m x m
            const AATinv = inverse(AAT);           // m x m
            pinvMat = multiplyRaw(AT, AATinv);     // n x m
        }

        const result = new PineMatrixObject(n, m, NaN, context);
        result.matrix = pinvMat;
        return result;
    };
}
