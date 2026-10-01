// SPDX-License-Identifier: AGPL-3.0-only

import { colorKey } from '../array/utils';

/**
 * The key under which `map` stores `key`. Colors are keys by value on TradingView, so a color written in
 * another form (`color.new(color.red, 0)` for `color.red`) finds the entry stored under the first form.
 */
export function resolveMapKey(map: Map<any, any>, key: any): any {
    if (map.has(key)) return key;
    const ck = colorKey(key);
    if (ck === null) return key;
    for (const k of map.keys()) {
        if (colorKey(k) === ck) return k;
    }
    return key;
}
