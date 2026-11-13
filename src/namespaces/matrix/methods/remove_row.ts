// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { PineArrayObject } from '../../array/PineArrayObject';
import { inferValueType } from '@pinets/namespaces/array/utils';
import { assertMatrixIndex } from '../indexValidation';
import { matrixRestructured, matrixStore } from '../capacity';

export function remove_row(context: Context) {
    return (id: PineMatrixObject, row_index: number) => {
        const store = matrixStore(id);
        assertMatrixIndex(row_index, store.length, 'row', 'matrix.remove_row');
        const removed = store.splice(row_index, 1);
        matrixRestructured(store);
        const removedValueType = inferValueType(removed[0][0]);
        return new PineArrayObject(removed[0] || [], removedValueType as any, context);
    };
}
