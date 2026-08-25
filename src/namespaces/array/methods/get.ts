// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { PineRuntimeError } from '../../../errors/PineRuntimeError';

export function get(context: any) {
    return (id: PineArrayObject, index: number) => {
        // Pine Script v6: negative indices count backwards from the end.
        // -1 = last element, -array.size() = first element.
        const resolved = index < 0 ? id.array.length + index : index;
        // TradingView halts the script with a runtime error on out-of-bounds access.
        if (resolved < 0 || resolved >= id.array.length) {
            throw new PineRuntimeError(
                `Index ${index} is out of bounds, array size is ${id.array.length}.`,
                'array.get'
            );
        }
        return id.array[resolved];
    };
}
