// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject, PineArrayType } from '../PineArrayObject';
import { inferArrayType, inferValueType } from '../utils';
import { Context } from '../../../Context.class';

export function new_fn(context: Context) {
    return <T>(size?: number, initial_value?: T): PineArrayObject => {
        // When no initial_value is provided, create an untyped (any) array.
        // The generic type parameter (e.g. <supertrend>, <float>) is lost during
        // transpilation, so we can't infer the element type — 'any' accepts all values.
        // Pine Script fills with 0 when size > 0 and no initial_value is given.
        if (initial_value === undefined) {
            const arr = size ? Array(size).fill(0) : [];
            return new PineArrayObject(arr, PineArrayType.any, context);
        }
        return new PineArrayObject(
            Array(size).fill(context.precision((initial_value as number) || 0)),
            inferValueType((initial_value as any) || 0),
            context
        );
    };
}
