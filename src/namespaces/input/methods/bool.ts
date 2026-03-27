// SPDX-License-Identifier: AGPL-3.0-only

import { parseInputOptions, resolveInput } from '../utils';

export function bool(context: any) {
    return (...args: any[]) => {
        const options = parseInputOptions(args);
        return resolveInput(context, options);
    };
}
