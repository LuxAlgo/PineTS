// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { PineRuntimeError } from '../../../errors/PineRuntimeError';
import { arrayStore } from '../capacity';

export function remove(context: any) {
    return (id: PineArrayObject, index: number): any => {
        const plain = arrayStore(id);
        // Pine Script v6: negative indices count backwards from the end.
        const resolved = index < 0 ? plain.length + index : index;
        // TradingView halts the script with a runtime error on out-of-bounds access.
        if (resolved < 0 || resolved >= plain.length) {
            throw new PineRuntimeError(
                `Index ${index} is out of bounds, array size is ${plain.length}.`,
                'array.remove'
            );
        }
        return plain.splice(resolved, 1)[0];
    };
}
