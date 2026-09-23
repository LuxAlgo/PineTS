// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { Series } from '../../Series';
import { PineRuntimeError } from '../../errors/PineRuntimeError';
import { VolumeRowObject } from './VolumeRowObject';
import { resolveArg } from './resolve';

function asRow(id: any, method: string): VolumeRowObject {
    const resolved = resolveArg(id);
    if (resolved instanceof VolumeRowObject) return resolved;
    throw new PineRuntimeError(`The \`volume_row\` ID used in the \`${method}()\` call cannot be \`na\`.`, `volume_row.${method}`);
}

/**
 * The `volume_row.*` namespace: read-only accessors over one footprint row. As
 * with `footprint.*`, an `na` id is a runtime error (TradingView's behavior) —
 * e.g. the `na` that `footprint.get_row_by_price()` returns outside the footprint.
 */
export class VolumeRowHelper {
    constructor(private context: any) {}

    param(source: any, index: number = 0, _name?: string) {
        return Series.from(source).get(index);
    }

    /** `volume_row(x)` — unlike `line(x)` or `box(x)`, Pine has no `volume_row` cast function. */
    any(): never {
        throw new PineRuntimeError("Could not find function or function reference 'volume_row'", 'volume_row');
    }

    up_price(id: any): number {
        return asRow(id, 'up_price').up_price();
    }

    down_price(id: any): number {
        return asRow(id, 'down_price').down_price();
    }

    buy_volume(id: any): number {
        return asRow(id, 'buy_volume').buy_volume();
    }

    sell_volume(id: any): number {
        return asRow(id, 'sell_volume').sell_volume();
    }

    total_volume(id: any): number {
        return asRow(id, 'total_volume').total_volume();
    }

    delta(id: any): number {
        return asRow(id, 'delta').delta();
    }

    has_buy_imbalance(id: any): boolean {
        return asRow(id, 'has_buy_imbalance').has_buy_imbalance();
    }

    has_sell_imbalance(id: any): boolean {
        return asRow(id, 'has_sell_imbalance').has_sell_imbalance();
    }
}
