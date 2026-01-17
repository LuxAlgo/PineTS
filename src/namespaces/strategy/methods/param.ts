// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * strategy.param() - Internal method for handling parameters
 * Used by the transpiler to wrap constant access
 */
export function param(context: any) {
    return (source: any, index: any, name?: string) => {
        if (typeof source === 'string') return source;

        if (source instanceof Series) {
            if (index) {
                return new Series(source.data, source.offset + index);
            }
            return source;
        }

        if (!Array.isArray(source) && typeof source === 'object') return source;

        if (!context.params[name]) context.params[name] = [];

        if (Array.isArray(source)) {
            return new Series(source, index || 0);
        } else {
            if (context.params[name].length === 0) {
                context.params[name].push(source);
            } else {
                context.params[name][context.params[name].length - 1] = source;
            }
            return new Series(context.params[name], 0);
        }
    };
}
