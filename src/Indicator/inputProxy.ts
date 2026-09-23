// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import type { IPineInput } from './types';
import { buildKeyedProxy, type KeyedSchemaEntry } from './keyedProxy';

/**
 * Build the live `.input` view exposed on an `Indicator` instance.
 *
 * Keyed by **varId** (the assigned variable name) as the canonical, primary
 * override key, with the input's **title** and declaration **id** (`in_N`)
 * registered as aliases. `.input['Title']` keeps working for the common case
 * (unique, non-empty titles). When two inputs share a title, the title
 * aliases the first. An input without a free varId or title (untitled
 * argument inputs, a variable assigned from several inputs) is keyed by its
 * id, which is always unique.
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
    const ids = new Set(metas.map((m) => m.id));
    for (const m of metas) {
        // prefer varId, then title, then the always-unique id
        const key = [m.varId, m.title].find((k) => k && !metaByKey.has(k) && !ids.has(k)) ?? m.id;
        const aliases = [m.title, m.id].filter((a): a is string => !!a && a !== key);
        metaByKey.set(key, m);
        entries.push({
            key,
            type: m.type,
            defval: m.defval,
            options: m.options,
            minval: m.minval,
            maxval: m.maxval,
            aliases: aliases.length ? aliases : undefined,
        });
    }
    const { proxy, values } = buildKeyedProxy(entries, 'Indicator.input', onSet, undefined, 'input key');
    return { proxy, values, metaByKey };
}
