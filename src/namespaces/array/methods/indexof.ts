// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { elementMatcher } from '../utils';

export function indexof(context: any) {
    return (id: PineArrayObject, value: any): number => {
        return id.array.findIndex(elementMatcher(id, value));
    };
}
