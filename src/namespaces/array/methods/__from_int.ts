// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject, PineArrayType } from '../PineArrayObject';

// array.from() whose arguments are all int-typed: the transpiler rewrites the call to this
// (see TypeInferencePass), since an int and a float value cannot be told apart at runtime.
export function __from_int(context: any) {
    return (...values: any[]): PineArrayObject => {
        return new PineArrayObject([...values], PineArrayType.int, context);
    };
}
