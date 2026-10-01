// SPDX-License-Identifier: AGPL-3.0-only

import { PineMapObject } from '../PineMapObject';
import { Context } from '../../../Context.class';

export function copy(context: Context) {
    return (id: PineMapObject) => {
        const newMap = new PineMapObject(context);
        newMap.map = new Map(id.map);
        newMap.valueType = id.valueType;
        return newMap;
    };
}
