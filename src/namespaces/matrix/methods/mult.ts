// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { PineArrayObject } from '../../array/PineArrayObject';

export function mult(context: Context) {
    return (id: PineMatrixObject, id2: PineMatrixObject | number | PineArrayObject) => {
        const rows1 = id.matrix.length;
        const cols1 = rows1 > 0 ? id.matrix[0].length : 0;

        if (id2 instanceof PineMatrixObject) {
            const rows2 = id2.matrix.length;
            const cols2 = rows2 > 0 ? id2.matrix[0].length : 0;

            if (cols1 !== rows2) {
                // Dimensions incompatible for matrix multiplication
                return new PineMatrixObject(0, 0, NaN, context);
            }

            const newMatrix = new PineMatrixObject(rows1, cols2, 0, context);

            for (let i = 0; i < rows1; i++) {
                for (let j = 0; j < cols2; j++) {
                    let sum = 0;
                    for (let k = 0; k < cols1; k++) {
                        sum += id.matrix[i][k] * id2.matrix[k][j];
                    }
                    newMatrix.matrix[i][j] = sum;
                }
            }
            return newMatrix;
        } else if (id2 instanceof PineArrayObject || Array.isArray((id2 as any).array || id2)) {
            // Vector multiplication — returns a PineArrayObject (flat vector),
            // matching TradingView behavior where matrix.mult(vector) → vector.
            const vec = (id2 as any).array || (id2 as any);
            if (cols1 !== vec.length) {
                return new PineArrayObject([], 'float' as any, context);
            }

            const result: number[] = [];
            for (let i = 0; i < rows1; i++) {
                let sum = 0;
                for (let j = 0; j < cols1; j++) {
                    sum += id.matrix[i][j] * vec[j];
                }
                result.push(sum);
            }
            return new PineArrayObject(result, 'float' as any, context);
        } else {
            // Scalar multiplication
            const scalar = id2 as number;
            const newMatrix = new PineMatrixObject(rows1, cols1, NaN, context);
            for (let i = 0; i < rows1; i++) {
                for (let j = 0; j < cols1; j++) {
                    newMatrix.matrix[i][j] = id.matrix[i][j] * scalar;
                }
            }
            return newMatrix;
        }
    };
}
