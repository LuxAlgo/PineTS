// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { PineArrayObject } from '../../array/PineArrayObject';
import { inferValueType } from '@pinets/namespaces/array/utils';
import { assertMatrixIndex } from '../indexValidation';
import { matrixStore } from '../capacity';

export function row(context: Context) {
    return (id: PineMatrixObject, row: number) => {
        const idRows = matrixStore(id);
        const rows = idRows.length;
        assertMatrixIndex(row, rows, 'row', 'matrix.row');
        const rowType = inferValueType(idRows[row][0]);
        return new PineArrayObject([...idRows[row]], rowType as any, context);
    };
}
