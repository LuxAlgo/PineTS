// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { emptyArray } from '../utils';

export function pop(context: any) {
    return (id: PineArrayObject): any => {
        if (id.array.length === 0) emptyArray('pop');
        return id.array.pop();
    };
}
