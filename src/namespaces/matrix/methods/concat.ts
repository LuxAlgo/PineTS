// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';

export function concat(context: Context) {
    return (id: PineMatrixObject, id2: PineMatrixObject) => {
        const rows1 = id.matrix.length;
        const rows2 = id2.matrix.length;
        if (rows1 === 0) {
            // If first matrix is empty, assume we adopt the structure of the second
            // But concat appends rows usually? Or does it append columns?
            // "The number of columns in both matrices must be identical." -> Vertical concatenation (append rows)
            for (let i = 0; i < rows2; i++) {
                id.matrix.push([...id2.matrix[i]]);
            }
            return id;
        }
        
        // If cols match, append rows
        const cols1 = id.matrix[0].length;
        const cols2 = rows2 > 0 ? id2.matrix[0].length : 0;
        
        if (cols1 !== cols2 && rows2 > 0) {
            // Error or ignore? Pine script throws runtime error.
            console.error(`matrix.concat: Column count mismatch ${cols1} vs ${cols2}`);
            return id;
        }

        for (let i = 0; i < rows2; i++) {
            id.matrix.push([...id2.matrix[i]]);
        }
        // TradingView returns the first matrix itself, so the result aliases id1.
        return id;
    };
}
