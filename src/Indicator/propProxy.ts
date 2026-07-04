// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import type { IPineProp } from './types';
import { buildKeyedProxy, type KeyedSchemaEntry } from './keyedProxy';

/**
 * Build the live `.prop` view exposed on an `Indicator` instance.
 * Name-keyed; non-mutable entries (`title`, `shorttitle`) are excluded.
 *
 * `sourceArgs` seeds source-code defaults on top of spec defaults so the
 * read view matches what TradingView's runtime would see before any user
 * override. Layer order: spec.defval ← sourceArgs ← user `.prop` writes.
 *
 * Backing machinery lives in `keyedProxy.ts` and is shared with `.input`.
 */
export function buildPropProxy(
    props: IPineProp[],
    sourceArgs: Record<string, unknown>,
    onSet?: (name: string) => void,
): {
    proxy: Record<string, unknown>;
    values: Record<string, unknown>;
    propByName: Map<string, IPineProp>;
} {
    const propByName = new Map<string, IPineProp>();
    const entries: KeyedSchemaEntry[] = [];
    for (const p of props) {
        propByName.set(p.name, p);
        if (!p.mutable) continue;
        // Map `enum` and other PinePropTypes onto KeyedType — they overlap directly.
        entries.push({
            key: p.name,
            type: p.type as any,
            defval: p.defval,
            options: p.options,
            minval: p.minval,
            maxval: p.maxval,
        });
    }
    const { proxy, values } = buildKeyedProxy(entries, 'Indicator.prop', onSet, sourceArgs);
    return { proxy, values, propByName };
}
