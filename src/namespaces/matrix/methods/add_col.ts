// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';

import { Series } from '../../../Series';
import { PineArrayObject } from '../../array/PineArrayObject';
import { assertMatrixIndex } from '../indexValidation';
import { assertMatrixDimensions, preflightCollectionGrowth } from '../../collectionCapacity';
import { arrayStore } from '../../array/capacity';
import { chargeMatrixGrowth, matrixRestructured, matrixStore } from '../capacity';

export function add_col(context: Context) {
    return (id: PineMatrixObject, column_index?: number, values?: any) => {
        const store = matrixStore(id);
        const rows = store.length;
        
        let colValues: any[] = [];
        if (values) {
            if (values instanceof PineArrayObject) {
                colValues = arrayStore(values);
            } else if (Array.isArray(values)) {
                colValues = values;
            } else {
                colValues = [values];
            }
        }

        const cols = rows > 0 ? store[0].length : 0;
        const index = column_index !== undefined ? column_index : cols;
        assertMatrixIndex(index, cols, 'column', 'matrix.add_col', true);

        const newRows = rows === 0 ? colValues.length : rows;
        const newCols = rows === 0 ? 1 : cols + 1;
        const currentSize = assertMatrixDimensions(rows, cols, 'matrix.add_col');
        const nextSize = assertMatrixDimensions(newRows, newCols, 'matrix.add_col');
        preflightCollectionGrowth(context, currentSize, nextSize, 'matrix.add_col');

        // One charge for the whole column, then every row grows by exactly one cell.
        chargeMatrixGrowth(context, nextSize - currentSize);

        if (rows === 0) {
            // Create rows based on colValues length
            for (let i = 0; i < colValues.length; i++) {
                let val = colValues[i];
                if (val instanceof Series) val = val.get(0);
                store.push([val]);
            }
            matrixRestructured(store);
            return;
        }

        for (let i = 0; i < rows; i++) {
            let val = i < colValues.length ? colValues[i] : NaN;
            if (val instanceof Series) val = val.get(0);
            store[i].splice(index, 0, val);
        }
        matrixRestructured(store);
    };
}

