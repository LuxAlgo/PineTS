// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { emptyArray } from '../utils';
import { arrayStore } from '../capacity';

export function first(context: any) {
    return (id: PineArrayObject): any => {
        const plain = arrayStore(id);
        if (plain.length === 0) emptyArray('first');
        return plain[0];
    };
}
