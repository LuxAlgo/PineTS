// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';

export function shift(context: any) {
    return (id: PineArrayObject): any => {
        // Pine returns na from a read on an empty array; throwing here made scripts that run on
        // TradingView die in the engine (Pine parity, see PROVENANCE patch 4).
        if (id.array.length === 0) return NaN;
        return id.array.shift();
    };
}
