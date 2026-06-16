// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import type { IPineInput } from './types';
import { buildKeyedProxy, type KeyedSchemaEntry } from './keyedProxy';

/**
 * Build the live `.input` view exposed on an `Indicator` instance.
 *
 * Keyed by **varId** (the assigned variable name) as the canonical, primary
 * override key, with the input's **title** registered as a secondary alias.
 * This makes every input overridable by a stable, unique handle — robust to
 * empty or duplicated titles — while `.input['Title']` keeps working for the
 * common case (unique, non-empty titles). When two inputs share a title, the
 * title aliases the first; the second is reachable only by its varId.
 *
 * Backing machinery lives in `keyedProxy.ts` and is shared with `.prop`.
 */
export function buildInputProxy(
    metas: IPineInput[],
    onSet?: (key: string) => void,
): {
    proxy: Record<string, unknown>;
    values: Record<string, unknown>;
    metaByKey: Map<string, IPineInput>;
} {
    const metaByKey = new Map<string, IPineInput>();
    const entries: KeyedSchemaEntry[] = [];
    for (const m of metas) {
        const key = m.varId ?? m.title; // prefer varId; fall back to title
        if (!key) continue;             // no handle at all → not overridable
        const aliases = m.title && m.title !== key ? [m.title] : undefined;
        metaByKey.set(key, m);
        entries.push({
            key,
            type: m.type,
            defval: m.defval,
            options: m.options,
            minval: m.minval,
            maxval: m.maxval,
            aliases,
        });
    }
    const { proxy, values } = buildKeyedProxy(entries, 'Indicator.input', onSet, undefined, 'input key');
    return { proxy, values, metaByKey };
}
