// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { PineArrayObject } from '../../array/PineArrayObject';
import { inferValueType } from '@pinets/namespaces/array/utils';
import { PineRuntimeError } from '../../../errors/PineRuntimeError';

export function col(context: Context) {
    return (id: PineMatrixObject, column: number) => {
        const rows = id.matrix.length;
        const cols = rows > 0 ? id.matrix[0].length : 0;
        // TradingView halts the script with a runtime error on out-of-bounds access.
        if (column < 0 || column >= cols) {
            throw new PineRuntimeError(
                `Column index ${column} is out of bounds, matrix has ${cols} columns.`,
                'matrix.col'
            );
        }
        const result = [];
        for (let i = 0; i < rows; i++) {
            result.push(id.matrix[i][column]);
        }
        const columnType = inferValueType(result[0]);
        return new PineArrayObject(result, columnType as any, context);
    };
}
