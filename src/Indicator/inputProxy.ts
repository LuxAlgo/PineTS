// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import type { IPineInput } from './types';
import { buildKeyedProxy, type KeyedSchemaEntry } from './keyedProxy';

/**
 * Build the live `.input` view exposed on an `Indicator` instance.
 * Title-keyed; entries without an explicit `title=` on the Pine source are
 * excluded (Pine's runtime keys overrides by title, so a title-less input is
 * not overridable).
 *
 * Backing machinery lives in `keyedProxy.ts` and is shared with `.prop`.
 */
export function buildInputProxy(
    metas: IPineInput[],
    onSet?: (title: string) => void,
): {
    proxy: Record<string, unknown>;
    values: Record<string, unknown>;
    metaByTitle: Map<string, IPineInput>;
} {
    const metaByTitle = new Map<string, IPineInput>();
    const entries: KeyedSchemaEntry[] = [];
    for (const m of metas) {
        if (!m.title) continue;
        metaByTitle.set(m.title, m);
        entries.push({
            key: m.title,
            type: m.type,
            defval: m.defval,
            options: m.options,
            minval: m.minval,
            maxval: m.maxval,
        });
    }
    const { proxy, values } = buildKeyedProxy(entries, 'Indicator.input', onSet, undefined, 'input title');
    return { proxy, values, metaByTitle };
}
