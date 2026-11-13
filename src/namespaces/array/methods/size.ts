// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { arrayStore } from '../capacity';

export function size(context: any) {
    return (id: PineArrayObject): number => {
        const plain = arrayStore(id);
        return plain.length;
    };
}

