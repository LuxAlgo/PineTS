// SPDX-License-Identifier: AGPL-3.0-only

import { InputOptions } from '../types';
import { parseInputOptions, resolveInput } from '../utils';

export function int(context: any) {
    return (...args: any[]) => {
        const options = parseInputOptions(args);
        return resolveInput(context, options, 'int');
    };
}
