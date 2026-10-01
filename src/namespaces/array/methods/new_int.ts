// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject, PineArrayType } from '../PineArrayObject';
import { Context } from '../../../Context.class';

export function new_int(context: Context) {
    return (size: number = 0, initial_value: number = NaN): PineArrayObject => {
        const safeSize = (typeof size === 'number' && size > 0 && !isNaN(size)) ? Math.floor(size) : 0;
        return new PineArrayObject(Array(safeSize).fill(context.precision(initial_value)), PineArrayType.int, context);
    };
}
