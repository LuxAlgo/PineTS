// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { isValueOfType } from '../utils';
import { Context } from '../../../Context.class';

export function push(context: Context) {
    return (id: PineArrayObject, value: any) => {
        if (!isValueOfType(value, id.type)) {
            throw new Error(
                `Cannot call 'array.push' with argument 'value'='${value}'. An argument of 'literal ${typeof value}' type was used but a '${
                    id.type
                }' is expected.`
            );
        }
        // Only apply precision rounding to numbers; UDT objects and other types pass through as-is
        id.array.push(typeof value === 'number' ? context.precision(value) : value);
    };
}
