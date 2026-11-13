// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { PineArrayObject } from '../../array/PineArrayObject';
import { inferValueType } from '@pinets/namespaces/array/utils';
import { assertMatrixIndex } from '../indexValidation';
import { matrixRestructured, matrixStore } from '../capacity';

export function remove_col(context: Context) {
    return (id: PineMatrixObject, column_index: number) => {
        const store = matrixStore(id);
        const rows = store.length;
        const cols = rows > 0 ? store[0].length : 0;
        assertMatrixIndex(column_index, cols, 'column', 'matrix.remove_col');

        const removedValues = [];
        for (let i = 0; i < rows; i++) {
            const removed = store[i].splice(column_index, 1);
            removedValues.push(removed[0]);
        }
        matrixRestructured(store);
        const removedValueType = inferValueType(removedValues[0]);
        return new PineArrayObject(removedValues, removedValueType as any, context);
    };
}
