// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import type { ImportInfo, ImportResolverLike } from './types';

/**
 * Resolves each import path once: the source (or the fact that the resolver
 * does not know the library) is kept, and concurrent requests for one path
 * share a single call. A resolver that throws is called again next time.
 *
 * `PineTS.setImportResolver` wraps the resolver it is given in one of these,
 * so libraries are not fetched again on every run, nor by the secondary
 * contexts of `request.security`.
 */
export class CachedImportResolver {
    private readonly cache = new Map<string, Promise<string | null>>();

    constructor(private readonly resolver: ImportResolverLike) {}

    resolve(path: string, info: ImportInfo): Promise<string | null> {
        let pending = this.cache.get(path);
        if (!pending) {
            const resolver = this.resolver;
            pending = Promise.resolve()
                .then(() => (typeof resolver === 'function' ? resolver(path, info) : resolver.resolve(path, info)))
                .then((source) => (typeof source === 'string' ? source : null));
            this.cache.set(path, pending);
            pending.catch(() => this.cache.delete(path));
        }
        return pending;
    }

    /** Forget every resolved library. */
    clear(): void {
        this.cache.clear();
    }
}
