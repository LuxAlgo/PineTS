// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { arrayStore } from '../capacity';

export function reverse(context: any) {
    return (id: PineArrayObject): void => {
        const plain = arrayStore(id);
        plain.reverse();
    };
}

