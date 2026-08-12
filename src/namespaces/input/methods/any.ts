// SPDX-License-Identifier: AGPL-3.0-only

import { parseInputOptions, resolveInput, resolveSourceName } from '../utils';

export function any(context: any) {
    return (...args: any[]) => {
        const options = parseInputOptions(args);
        const resolved = resolveInput(context, options);
        // Auto-typed `input(close, …)`: at runtime the declared default is the
        // current-bar SCALAR (the transpiler wraps the series arg in
        // `input.param`), so a STRING override on a NUMERIC default can only be
        // a source name — dereference it like input.source does. A string
        // default means a string input: overrides pass through untouched.
        if (typeof resolved === 'string' && typeof options.defval === 'number') {
            const val = resolveSourceName(context, resolved);
            if (val !== undefined) return val;
        }
        return resolved;
    };
}
