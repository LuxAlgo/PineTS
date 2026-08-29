// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { PineArrayObject } from '../../array/PineArrayObject';
import { inferValueType } from '@pinets/namespaces/array/utils';
import { PineRuntimeError } from '../../../errors/PineRuntimeError';

export function row(context: Context) {
    return (id: PineMatrixObject, row: number) => {
        const rows = id.matrix.length;
        // TradingView halts the script with a runtime error on out-of-bounds access.
        if (row < 0 || row >= rows) {
            throw new PineRuntimeError(
                `Row index ${row} is out of bounds, matrix has ${rows} rows.`,
                'matrix.row'
            );
        }
        const rowType = inferValueType(id.matrix[row][0]);
        return new PineArrayObject([...id.matrix[row]], rowType as any, context);
    };
}
