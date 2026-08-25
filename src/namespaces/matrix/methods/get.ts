// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { PineRuntimeError } from '../../../errors/PineRuntimeError';

export function get(context: Context) {
    return (id: PineMatrixObject, row: number, col: number) => {
        const rows = id.matrix.length;
        const cols = rows > 0 ? id.matrix[0].length : 0;
        // TradingView halts the script with a runtime error on out-of-bounds access.
        if (row < 0 || row >= rows) {
            throw new PineRuntimeError(
                `Row index ${row} is out of bounds, matrix has ${rows} rows.`,
                'matrix.get'
            );
        }
        if (col < 0 || col >= cols) {
            throw new PineRuntimeError(
                `Column index ${col} is out of bounds, matrix has ${cols} columns.`,
                'matrix.get'
            );
        }
        const val = id.matrix[row][col];
        return val === undefined ? NaN : val;
    };
}
