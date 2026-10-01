// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { emptyArray } from '../utils';

export function shift(context: any) {
    return (id: PineArrayObject): any => {
        if (id.array.length === 0) emptyArray('shift');
        return id.array.shift();
    };
}
