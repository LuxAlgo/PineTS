// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { isValueOfType } from '../utils';
import { Context } from '../../../Context.class';
import { PineRuntimeError } from '../../../errors/PineRuntimeError';

export function set(context: Context) {
    return (id: PineArrayObject, index: number, value: any) => {
        if (!isValueOfType(value, id.type)) {
            throw new Error(
                `Cannot call 'array.set' with argument 'value'='${value}'. An argument of 'literal ${typeof value}' type was used but a '${
                    id.type
                }' is expected.`
            );
        }
        // Pine Script v6: negative indices count backwards from the end.
        const resolved = index < 0 ? id.array.length + index : index;
        // TradingView halts the script with a runtime error on out-of-bounds access.
        if (resolved < 0 || resolved >= id.array.length) {
            throw new PineRuntimeError(
                `Index ${index} is out of bounds, array size is ${id.array.length}.`,
                'array.set'
            );
        }
        id.array[resolved] = typeof value === 'number' ? context.precision(value) : value;
    };
}
