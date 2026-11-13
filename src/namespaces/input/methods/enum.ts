// SPDX-License-Identifier: AGPL-3.0-only

import { parseInputOptionsCached, resolveInput } from '../utils';

export function enum_fn(context: any) {
    return (...args: any[]) => {
        const options = parseInputOptionsCached(context, args);
        return resolveInput(context, options, 'enum');
    };
}
