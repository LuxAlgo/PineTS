// SPDX-License-Identifier: AGPL-3.0-only

import { PineMapObject } from '../PineMapObject';
import { Context } from '../../../Context.class';
import { resolveMapKey } from '../utils';
import { MAP_ENTRY_BYTES, preflightCollectionGrowth } from '../../collectionCapacity';

export function put_all(context: Context) {
    return (id: PineMapObject, id2: PineMapObject) => {
        // Simulate key canonicalization first; a budget failure must not commit even
        // the overlapping entries that precede a new key in the source map.
        const projected = new Map(id.map);
        for (const [key, value] of id2.map) projected.set(resolveMapKey(projected, key), value);
        preflightCollectionGrowth(context, id.map.size, projected.size, 'map.put_all', MAP_ENTRY_BYTES);
        for (const [key, value] of id2.map) {
            id.map.set(resolveMapKey(id.map, key), value);
        }
    };
}
