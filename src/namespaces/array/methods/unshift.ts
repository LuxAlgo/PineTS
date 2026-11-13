// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { isValueOfType } from '../utils';
import { Context } from '../../../Context.class';
import { preflightArrayGrowth } from '../capacity';

export function unshift(context: Context) {
    return (id: PineArrayObject, value: any): void => {
        if (!isValueOfType(value, id.type)) {
            throw new Error(
                `Cannot call 'array.unshift' with argument 'value'='${value}'. An argument of 'literal ${typeof value}' type was used but a '${
                    id.type
                }' is expected.`
            );
        }
        preflightArrayGrowth(id.array, 1, context, 'array.unshift');
        id.array.unshift(typeof value === 'number' ? context.precision(value) : value);
    };
}
