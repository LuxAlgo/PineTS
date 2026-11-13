// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { arrayStore } from '../capacity';

export function every(context: any) {
    return (id: PineArrayObject): boolean => {
        const plain = arrayStore(id);
        // An empty array is false on TradingView, unlike Array.prototype.every.
        if (plain.length === 0) return false;
        return plain.every((value: number) => !isNaN(value) && value);
    };
}
