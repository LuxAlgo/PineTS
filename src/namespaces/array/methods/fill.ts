// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { isValueOfType } from '../utils';
import { Context } from '../../../Context.class';

export function fill(context: Context) {
    return (id: PineArrayObject, value: any, start: number = 0, end?: number): void => {
        const length = id.array.length;
        const adjustedEnd = end !== undefined ? Math.min(end, length) : length;

        for (let i = start; i < adjustedEnd; i++) {
            if (!isValueOfType(value, id.type)) {
                throw new Error(
                    `Cannot call 'array.fill' with argument 'value'='${value}'. An argument of 'literal ${typeof value}' type was used but a '${
                        id.type
                    }' is expected.`
                );
            }
            id.array[i] = typeof value === 'number' ? context.precision(value) : value;
        }
    };
}
