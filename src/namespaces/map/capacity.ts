// SPDX-License-Identifier: AGPL-3.0-only

import { MAP_ENTRY_BYTES, chargeCollectionAllocation, preflightCollectionGrowth } from '../collectionCapacity';

/** All map writes, including calls through the exposed map property, share the same cap. */
export class BoundedPineMap extends Map<any, any> {
    constructor(private readonly context: any) {
        super();
    }

    override set(key: any, value: any): this {
        if (!this.has(key)) {
            preflightCollectionGrowth(this.context, this.size, this.size + 1, 'map.put', MAP_ENTRY_BYTES);
            chargeCollectionAllocation(this.context, 1, 'map.put', MAP_ENTRY_BYTES);
        }
        return super.set(key, value);
    }
}
