// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { PineRuntimeError } from '../../../errors/PineRuntimeError';

export function remove(context: any) {
    return (id: PineArrayObject, index: number): any => {
        // Pine Script v6: negative indices count backwards from the end.
        const resolved = index < 0 ? id.array.length + index : index;
        // TradingView halts the script with a runtime error on out-of-bounds access.
        if (resolved < 0 || resolved >= id.array.length) {
            throw new PineRuntimeError(
                `Index ${index} is out of bounds, array size is ${id.array.length}.`,
                'array.remove'
            );
        }
        return id.array.splice(resolved, 1)[0];
    };
}
