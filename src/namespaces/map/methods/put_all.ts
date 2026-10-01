// SPDX-License-Identifier: AGPL-3.0-only

import { PineMapObject } from '../PineMapObject';
import { Context } from '../../../Context.class';
import { resolveMapKey } from '../utils';

export function put_all(context: Context) {
    return (id: PineMapObject, id2: PineMapObject) => {
        for (const [key, value] of id2.map) {
            id.map.set(resolveMapKey(id.map, key), value);
        }
    };
}
