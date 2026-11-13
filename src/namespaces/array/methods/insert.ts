// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { isValueOfType } from '../utils';
import { PineRuntimeError } from '../../../errors/PineRuntimeError';
import { arrayStore, chargeArrayGrowth, preflightArrayGrowth } from '../capacity';

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
        const store = arrayStore(id);
        const size = store.length;
        const resolved = index < 0 ? size + index : index;
        // For insert, valid indices are 0 to array.length (inclusive — insert at end is valid).
        // TradingView halts the script with a runtime error on out-of-bounds access.
        if (resolved < 0 || resolved > size) {
            throw new PineRuntimeError(
                `Index ${index} is out of bounds, array size is ${size}.`,
                'array.insert'
            );
        }
        preflightArrayGrowth(store, 1, context, 'array.insert');
        chargeArrayGrowth(store, 1, context);
        store.splice(resolved, 0, value);
    };
}
