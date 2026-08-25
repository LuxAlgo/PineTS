// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { isValueOfType } from '../utils';
import { PineRuntimeError } from '../../../errors/PineRuntimeError';

export function insert(context: any) {
    return (id: PineArrayObject, index: number, value: any): void => {
        if (!isValueOfType(value, id.type)) {
            throw new Error(
                `Cannot call 'array.insert' with argument 'value'='${value}'. An argument of 'literal ${typeof value}' type was used but a '${
                    id.type
                }' is expected.`
            );
        }
        // Pine Script v6: negative indices count backwards from the end.
        const resolved = index < 0 ? id.array.length + index : index;
        // For insert, valid indices are 0 to array.length (inclusive — insert at end is valid).
        // TradingView halts the script with a runtime error on out-of-bounds access.
        if (resolved < 0 || resolved > id.array.length) {
            throw new PineRuntimeError(
                `Index ${index} is out of bounds, array size is ${id.array.length}.`,
                'array.insert'
            );
        }
        id.array.splice(resolved, 0, value);
    };
}
