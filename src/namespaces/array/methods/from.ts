// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject, PineArrayType } from '../PineArrayObject';
import { inferArrayType } from '../utils';

export function from(context: any) {
    return (...values: any[]): PineArrayObject => {
        // Numbers make a float array: `1.0` and `1` are the same runtime value, so int arrays
        // come from the transpiler's `array.__from_int` rewrite when every argument is int-typed.
        const type = inferArrayType(values);
        return new PineArrayObject([...values], type === PineArrayType.int ? PineArrayType.float : type, context);
    };
}
