// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { Series } from '../../Series';
import { PineRuntimeError } from '../../errors/PineRuntimeError';
import { FootprintObject } from './FootprintObject';
import { VolumeRowObject } from './VolumeRowObject';
import { resolveArg } from './resolve';

function asFootprint(id: any, method: string): FootprintObject {
    const resolved = resolveArg(id);
    if (resolved instanceof FootprintObject) return resolved;
    throw new PineRuntimeError(`The \`footprint\` ID used in the \`${method}()\` call cannot be \`na\`.`, `footprint.${method}`);
}

/**
 * The `footprint.*` namespace: read-only accessors over the `footprint` object a
 * `request.footprint()` call returns. As on TradingView, an `na` id is a runtime
 * error, so scripts guard with `not na(fp)` on bars without footprint data.
 */
export class FootprintHelper {
    constructor(private context: any) {}

    param(source: any, index: number = 0, _name?: string) {
        return Series.from(source).get(index);
    }

    /** `footprint(x)` — unlike `line(x)` or `box(x)`, Pine has no `footprint` cast function. */
    any(): never {
        throw new PineRuntimeError("Could not find function or function reference 'footprint'", 'footprint');
    }

    buy_volume(id: any): number {
        return asFootprint(id, 'buy_volume').buy_volume();
    }

    sell_volume(id: any): number {
        return asFootprint(id, 'sell_volume').sell_volume();
    }

    total_volume(id: any): number {
        return asFootprint(id, 'total_volume').total_volume();
    }

    delta(id: any): number {
        return asFootprint(id, 'delta').delta();
    }

    poc(id: any): VolumeRowObject {
        return asFootprint(id, 'poc').poc();
    }

    vah(id: any): VolumeRowObject {
        return asFootprint(id, 'vah').vah();
    }

    val(id: any): VolumeRowObject {
        return asFootprint(id, 'val').val();
    }

    rows(id: any) {
        return asFootprint(id, 'rows').rows();
    }

    get_row_by_price(id: any, price: any): VolumeRowObject | number {
        return asFootprint(id, 'get_row_by_price').get_row_by_price(price);
    }
}
