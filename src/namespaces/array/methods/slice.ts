// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { createSliceView } from '../sliceView';
import { isNa, outOfBounds } from '../utils';
import { PineRuntimeError } from '../../../errors/PineRuntimeError';

export function slice(context: any) {
    return (id: PineArrayObject, index_from: number = 0, index_to?: number): PineArrayObject => {
        const size = id.array.length;
        const from = isNa(index_from) ? 0 : index_from;
        const to = index_to === undefined || isNa(index_to) ? size : index_to;
        // `from` must address an element, so slicing an empty array is an error on TradingView too.
        if (from < 0 || from >= size) outOfBounds(from, size, 'array.slice');
        if (to < 0 || to > size) outOfBounds(to, size, 'array.slice');
        if (from > to) throw new PineRuntimeError("Index 'from' should be less than index 'to'.", 'array.slice');
        return new PineArrayObject(createSliceView(id.array, from, to - from), id.type, context);
    };
}
