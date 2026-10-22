// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';

export function new_fn(context: Context) {
    return (rows: number, cols: number, initial_value: any): PineMatrixObject => {
        return new PineMatrixObject(rows, cols, initial_value, context);
    };
}
