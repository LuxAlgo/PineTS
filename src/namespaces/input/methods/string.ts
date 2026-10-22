// SPDX-License-Identifier: AGPL-3.0-only

import { parseInputOptions, resolveInput } from '../utils';

export function string(context: any) {
    return (...args: any[]) => {
        const options = parseInputOptions(args);
        return resolveInput(context, options, 'string');
    };
}
