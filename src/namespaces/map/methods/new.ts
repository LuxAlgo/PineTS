// SPDX-License-Identifier: AGPL-3.0-only

import { PineMapObject } from '../PineMapObject';
import { Context } from '../../../Context.class';

export function new_fn(context: Context) {
    // `valueType` is 'string' for map.new<K, string>() (passed by the transpiler).
    return (valueType?: string): PineMapObject => {
        const map = new PineMapObject(context);
        if (valueType === 'string') map.valueType = valueType;
        return map;
    };
}
