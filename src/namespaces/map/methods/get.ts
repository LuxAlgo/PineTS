// SPDX-License-Identifier: AGPL-3.0-only

import { PineMapObject } from '../PineMapObject';
import { Context } from '../../../Context.class';
import { resolveMapKey } from '../utils';

export function get(context: Context) {
    return (id: PineMapObject, key: any) => {
        const val = id.map.get(resolveMapKey(id.map, key));
        // A missing key reads as na: the na string ("") for map<K, string>, NaN otherwise.
        if (val === undefined) return id.valueType === 'string' ? '' : NaN;
        return val;
    };
}
