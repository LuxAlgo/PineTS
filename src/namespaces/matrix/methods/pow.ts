// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { matrixStore } from '../capacity';

export function pow(context: Context) {
    return (id: PineMatrixObject, power: number) => {
        const source = matrixStore(id);
        const rows = source.length;
        const cols = rows > 0 ? source[0].length : 0;

        if (rows !== cols) {
            // Must be square
            return new PineMatrixObject(0, 0, NaN, context);
        }

        // Identity matrix for power 0
        let result = new PineMatrixObject(rows, cols, 0, context);
        let resultRows = matrixStore(result);
        for (let i = 0; i < rows; i++) resultRows[i][i] = 1;

        let base = new PineMatrixObject(rows, cols, NaN, context);
        let baseRows = matrixStore(base);
        // Deep copy base, cell by cell: both are rows x cols
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) baseRows[i][j] = source[i][j];
        }

        let p = Math.floor(power);
        // A non-finite power (e.g. Infinity from math.pow(10, 400)) is a fixed
        // point of `p = Math.floor(p / 2)`, so the loop below would never
        // terminate (a pure CPU spin). Reject it, like a negative power, with a
        // na matrix instead of hanging the host thread.
        if (!Number.isFinite(p) || p < 0) return new PineMatrixObject(rows, cols, NaN, context); // Or inverse? Pine usually doesn't do matrix power inversion automatically here

        while (p > 0) {
            if (p % 2 === 1) {
                // result = result * base
                const temp = new PineMatrixObject(rows, cols, 0, context);
                const tempRows = matrixStore(temp);
                for (let i = 0; i < rows; i++) {
                    for (let j = 0; j < cols; j++) {
                        let sum = 0;
                        for (let k = 0; k < rows; k++) {
                            sum += resultRows[i][k] * baseRows[k][j];
                        }
                        tempRows[i][j] = sum;
                    }
                }
                result = temp;
                resultRows = tempRows;
            }
            // base = base * base
            const tempBase = new PineMatrixObject(rows, cols, 0, context);
            const tempBaseRows = matrixStore(tempBase);
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    let sum = 0;
                    for (let k = 0; k < rows; k++) {
                        sum += baseRows[i][k] * baseRows[k][j];
                    }
                    tempBaseRows[i][j] = sum;
                }
            }
            base = tempBase;
            baseRows = tempBaseRows;
            p = Math.floor(p / 2);
        }

        return result;
    };
}
