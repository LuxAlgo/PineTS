// SPDX-License-Identifier: AGPL-3.0-only

import { PineMapObject } from '../PineMapObject';
import { Context } from '../../../Context.class';
import { resolveMapKey } from '../utils';

export function put(context: Context) {
    return (id: PineMapObject, key: any, value: any) => {
        const k = resolveMapKey(id.map, key);
        const prev = id.map.get(k);
        id.map.set(k, value);
        return prev === undefined ? NaN : prev;
    };
}
