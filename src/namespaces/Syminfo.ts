// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { Series } from '../Series';
import { stripTickerModifier } from '../tickerModifier';

/**
 * The exchange prefix and the ticker of a symbol (`"BINANCE:ETHUSDT"` → `["BINANCE", "ETHUSDT"]`),
 * modifiers removed. Both are empty for a symbol without a prefix, as on TradingView.
 */
function splitSymbol(symbol: any): [string, string] {
    const value = Series.from(symbol).get(0);
    if (value == null || (typeof value === 'number' && isNaN(value))) return ['', ''];
    const plain = stripTickerModifier(String(value));
    const at = plain.indexOf(':');
    return at < 0 ? ['', ''] : [plain.slice(0, at), plain.slice(at + 1)];
}

/**
 * The `syminfo` namespace: the provider's symbol info (`syminfo.ticker`, `syminfo.mintick`, …) plus
 * the function forms `syminfo.ticker(symbol)` / `syminfo.prefix(symbol)`, which the transpiler emits
 * as `syminfo.__ticker` / `syminfo.__prefix` since the variables of the same name are strings.
 */
export function createSyminfo(info: any): any {
    return {
        ...info,
        param: (source: any, index: number = 0) => Series.from(source).get(index),
        __ticker: (symbol: any) => splitSymbol(symbol)[1],
        __prefix: (symbol: any) => splitSymbol(symbol)[0],
    };
}
