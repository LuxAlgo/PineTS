// SPDX-License-Identifier: AGPL-3.0-only

import { parseInputOptions, resolveInput, resolveSourceName } from '../utils';

export function source(context: any) {
    return (...args: any[]) => {
        const options = parseInputOptions(args);
        const resolved = resolveInput(context, options);
        // A runtime override reaches us as the series NAME ('close', 'hlc3', …) —
        // the only encoding a host/worker boundary can serialize. Dereference it
        // to that series' current-bar value. An unknown name falls back to the
        // declared default (same behavior as "no override").
        if (typeof resolved === 'string') {
            const val = resolveSourceName(context, resolved);
            return val !== undefined ? val : options.defval;
        }
        return resolved;
    };
}
