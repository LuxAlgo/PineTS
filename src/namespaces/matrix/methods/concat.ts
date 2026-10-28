// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { assertMatrixDimensions, preflightCollectionGrowth } from '../../collectionCapacity';

export function concat(context: Context) {
    return (id: PineMatrixObject, id2: PineMatrixObject) => {
        const rows1 = id.matrix.length;
        const rows2 = id2.matrix.length;
        const cols1 = rows1 > 0 ? id.matrix[0].length : 0;
        const cols2 = rows2 > 0 ? id2.matrix[0].length : 0;
        if (rows1 > 0 && cols1 !== cols2 && rows2 > 0) {
            console.error(`matrix.concat: Column count mismatch ${cols1} vs ${cols2}`);
            return id;
        }
        const cols = rows1 > 0 ? cols1 : cols2;
        const before = assertMatrixDimensions(rows1, cols, 'matrix.concat');
        const after = assertMatrixDimensions(rows1 + rows2, cols, 'matrix.concat');
        preflightCollectionGrowth(context, before, after, 'matrix.concat');
        const copiedRows = id2.matrix.map((row) => [...row]);
        for (const row of copiedRows) id.matrix.push(row);
        // TradingView returns the first matrix itself, so the result aliases id1.
        return id;
    };
}
