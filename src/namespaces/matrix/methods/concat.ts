// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { assertMatrixDimensions, preflightCollectionGrowth } from '../../collectionCapacity';
import { chargeMatrixGrowth, matrixRestructured, matrixStore } from '../capacity';

export function concat(context: Context) {
    return (id: PineMatrixObject, id2: PineMatrixObject) => {
        const store = matrixStore(id);
        const store2 = matrixStore(id2);
        const rows1 = store.length;
        const rows2 = store2.length;
        const cols1 = rows1 > 0 ? store[0].length : 0;
        const cols2 = rows2 > 0 ? store2[0].length : 0;
        if (rows1 > 0 && cols1 !== cols2 && rows2 > 0) {
            console.error(`matrix.concat: Column count mismatch ${cols1} vs ${cols2}`);
            return id;
        }
        const cols = rows1 > 0 ? cols1 : cols2;
        const before = assertMatrixDimensions(rows1, cols, 'matrix.concat');
        const after = assertMatrixDimensions(rows1 + rows2, cols, 'matrix.concat');
        preflightCollectionGrowth(context, before, after, 'matrix.concat');
        // Copies, taken before appending so that a matrix can be concatenated to itself.
        const copiedRows = store2.map((row) => [...row]);
        chargeMatrixGrowth(context, after - before);
        for (const row of copiedRows) store.push(row);
        matrixRestructured(store);
        // TradingView returns the first matrix itself, so the result aliases id1.
        return id;
    };
}
