// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { elementMatcher } from '../utils';
import { arrayStore } from '../capacity';

export function lastindexof(context: any) {
    return (id: PineArrayObject, value: any): number => {
        const plain = arrayStore(id);
        const arr = plain;
        const matches = elementMatcher(id, value);
        for (let i = arr.length - 1; i >= 0; i--) {
            if (matches(arr[i])) return i;
        }
        return -1;
    };
}
