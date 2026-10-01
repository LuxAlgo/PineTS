// SPDX-License-Identifier: AGPL-3.0-only

import { PineMapObject } from '../PineMapObject';
import { Context } from '../../../Context.class';
import { resolveMapKey } from '../utils';

export function remove(context: Context) {
    return (id: PineMapObject, key: any) => {
        const k = resolveMapKey(id.map, key);
        const val = id.map.get(k);
        const existed = id.map.delete(k);
        return existed ? val : NaN;
    };
}
