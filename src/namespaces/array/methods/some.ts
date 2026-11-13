// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { arrayStore } from '../capacity';

export function some(context: any) {
    return (id: PineArrayObject): boolean => {
        const plain = arrayStore(id);
        return plain.some((value: number) => !isNaN(value) && value);
    };
}
