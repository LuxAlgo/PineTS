// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { PineArrayObject } from '../../array/PineArrayObject';
import { inferValueType } from '@pinets/namespaces/array/utils';
import { assertMatrixIndex } from '../indexValidation';

export function row(context: Context) {
    return (id: PineMatrixObject, row: number) => {
        const rows = id.matrix.length;
        assertMatrixIndex(row, rows, 'row', 'matrix.row');
        const rowType = inferValueType(id.matrix[row][0]);
        return new PineArrayObject([...id.matrix[row]], rowType as any, context);
    };
}
