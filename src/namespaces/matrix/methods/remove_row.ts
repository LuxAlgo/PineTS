// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { PineArrayObject } from '../../array/PineArrayObject';
import { inferValueType } from '@pinets/namespaces/array/utils';
import { assertMatrixIndex } from '../indexValidation';

export function remove_row(context: Context) {
    return (id: PineMatrixObject, row_index: number) => {
        assertMatrixIndex(row_index, id.matrix.length, 'row', 'matrix.remove_row');
        const removed = id.matrix.splice(row_index, 1);
        const removedValueType = inferValueType(removed[0][0]);
        return new PineArrayObject(removed[0] || [], removedValueType as any, context);
    };
}
