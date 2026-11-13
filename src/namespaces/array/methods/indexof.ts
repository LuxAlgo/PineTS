// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { elementMatcher } from '../utils';
import { arrayStore } from '../capacity';

export function indexof(context: any) {
    return (id: PineArrayObject, value: any): number => {
        const plain = arrayStore(id);
        return plain.findIndex(elementMatcher(id, value));
    };
}
