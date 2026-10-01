// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';

export function every(context: any) {
    return (id: PineArrayObject): boolean => {
        // An empty array is false on TradingView, unlike Array.prototype.every.
        if (id.array.length === 0) return false;
        return id.array.every((value: number) => !isNaN(value) && value);
    };
}
