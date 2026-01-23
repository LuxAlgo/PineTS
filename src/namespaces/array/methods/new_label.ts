// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject, PineArrayType } from '../PineArrayObject';

/**
 * Creates a new array of label objects.
 * @param size - The initial size of the array
 * @param initial_value - The initial value for all elements (default: na)
 * @returns A new PineArrayObject of type label
 */
export function new_label(context: any) {
    return (size: number = 0, initial_value: any = NaN): PineArrayObject => {
        return new PineArrayObject(Array(size).fill(initial_value), PineArrayType.label, context);
    };
}
