// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { isValueOfType } from '../utils';
import { Context } from '../../../Context.class';

export function set(context: Context) {
    return (id: PineArrayObject, index: number, value: any) => {
        if (!isValueOfType(value, id.type)) {
            throw new Error(
                `Cannot call 'array.set' with argument 'value'='${value}'. An argument of 'literal ${typeof value}' type was used but a '${
                    id.type
                }' is expected.`
            );
        }
        id.array[index] = typeof value === 'number' ? context.precision(value) : value;
    };
}
