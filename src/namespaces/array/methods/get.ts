// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';

export function get(context: any) {
    return (id: PineArrayObject, index: number) => {
        // Bounds check: return NaN (Pine's na) for out-of-bounds access.
        // In TradingView, out-of-bounds array.get() throws a runtime error.
        // PineTS returns na instead to avoid hard crashes during development/testing.
        if (index < 0 || index >= id.array.length) {
            return NaN;
        }
        return id.array[index];
    };
}

