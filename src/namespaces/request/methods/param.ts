// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function param(context: any) {
    return (source: any, index: any, name?: string) => {
        if (!context.params[name]) context.params[name] = [];

        let val;
        if (source instanceof Series) {
            // Source is a Series - extract the value at index
            val = source.get(index || 0);
        } else if (Array.isArray(source)) {
            // Check if this is a tuple expression vs a time-series array
            //
            // For request.security/security_lower_tf, tuples are always passed as arrays of expressions.
            // A tuple can contain Series objects, scalars, or a mix (e.g., [open, close, wVolSrc()]).
            //
            // Detection: If any element is a Series, it's a tuple (time-series arrays don't contain
            // Series at the top level). If all elements are scalars (no nested arrays), it's also
            // a tuple of literal values. Only arrays with nested arrays are time-series data.

            const hasAnySeries = source.some((elem) => elem instanceof Series);
            const hasOnlyScalars = source.every((elem) => !(elem instanceof Series) && !Array.isArray(elem));
            const isTuple = (hasAnySeries || hasOnlyScalars) && source.length >= 1;

            if (isTuple) {
                // Extract current value from each element (Series → .get(0), scalars pass through)
                val = source.map((elem: any) => elem instanceof Series ? elem.get(0) : elem);
            } else {
                // Time-series array - extract value at index
                val = Series.from(source).get(index || 0);
            }
        } else {
            val = source;
        }

        if (context.params[name].length === 0) {
            context.params[name].push(val);
        } else {
            context.params[name][context.params[name].length - 1] = val;
        }

        return [val, name];
    };
}
