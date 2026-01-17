// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject, PineArrayType } from '../PineArrayObject';

/**
 * Creates a new array of color values.
 * @param size - The initial size of the array
 * @param initial_value - The initial color value for all elements (default: na)
 * @returns A new PineArrayObject of type color
 */
export function new_color(context: any) {
    return (size: number = 0, initial_value: string = ''): PineArrayObject => {
        return new PineArrayObject(Array(size).fill(initial_value), PineArrayType.color, context);
    };
}
