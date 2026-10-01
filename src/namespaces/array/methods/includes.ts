// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { elementMatcher } from '../utils';

export function includes(context: any) {
    return (id: PineArrayObject, value: any): boolean => {
        return id.array.some(elementMatcher(id, value));
    };
}
