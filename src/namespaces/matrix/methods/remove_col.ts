// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { PineArrayObject } from '../../array/PineArrayObject';
import { inferValueType } from '@pinets/namespaces/array/utils';
import { assertMatrixIndex } from '../indexValidation';

export function remove_col(context: Context) {
    return (id: PineMatrixObject, column_index: number) => {
        const rows = id.matrix.length;
        const cols = rows > 0 ? id.matrix[0].length : 0;
        assertMatrixIndex(column_index, cols, 'column', 'matrix.remove_col');

        const removedValues = [];
        for (let i = 0; i < rows; i++) {
            const removed = id.matrix[i].splice(column_index, 1);
            removedValues.push(removed[0]);
        }
        const removedValueType = inferValueType(removedValues[0]);
        return new PineArrayObject(removedValues, removedValueType as any, context);
    };
}
