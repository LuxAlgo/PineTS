// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { elementMatcher } from '../utils';
import { arrayStore } from '../capacity';

export function includes(context: any) {
    return (id: PineArrayObject, value: any): boolean => {
        const plain = arrayStore(id);
        return plain.some(elementMatcher(id, value));
    };
}
