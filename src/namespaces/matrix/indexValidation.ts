// SPDX-License-Identifier: AGPL-3.0-only

import { PineRuntimeError } from '../../errors/PineRuntimeError';

/** Reject non-numeric keys before any matrix array property is accessed. */
export function assertMatrixIndex(
    index: unknown,
    size: number,
    axis: 'row' | 'column',
    method: string,
    allowEnd = false,
): asserts index is number {
    if (Number.isSafeInteger(index) && (index as number) >= 0 && (allowEnd ? (index as number) <= size : (index as number) < size)) {
        return;
    }
    const shown = index === null || ['string', 'number', 'boolean', 'bigint', 'undefined'].includes(typeof index)
        ? String(index)
        : typeof index;
    const label = axis === 'row' ? 'Row' : 'Column';
    const units = axis === 'row' ? 'rows' : 'columns';
    throw new PineRuntimeError(`${label} index ${shown} is out of bounds, matrix has ${size} ${units}.`, method);
}
