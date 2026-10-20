// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import type { BaseImportResolverConfig, IImportResolver, ImportInfo } from './IImportResolver';

/**
 * Abstract base class for import resolvers.
 *
 * Provides shared logic: caching, the fail-early configuration check, and
 * the extension lookup of file-based resolvers.
 *
 * ## Caching
 *
 * `resolve()` asks `_resolveNative()` for each import path once and keeps the
 * result — the source, or `null` for a library the resolver does not know —
 * for `cacheDuration` milliseconds (by default, for as long as the resolver
 * lives), so libraries are not fetched again on every run, nor by the
 * secondary contexts of `request.security`. Concurrent requests for one path
 * share one call. An error is not kept: the next request tries again.
 * `configure()` and `clearCache()` empty the cache.
 *
 * ## Usage
 *
 * ```typescript
 * class MyImportResolver extends BaseImportResolver {
 *     constructor() {
 *         super({ requiresConfig: false, resolverName: 'My' });
 *     }
 *     protected async _resolveNative(info: ImportInfo) {
 *         const res = await fetch(`https://my-server/libraries/${info.name}`);
 *         return res.ok ? res.text() : null;
 *     }
 * }
 * ```
 */
export abstract class BaseImportResolver<TConfig extends BaseImportResolverConfig = BaseImportResolverConfig> implements IImportResolver {
    private _configured: boolean;
    private _resolverName: string;
    private _cached: boolean;
    private _cacheDuration = Infinity;
    private _cache = new Map<string, { source: Promise<string | null>; time: number }>();

    constructor(options: { requiresConfig: boolean; resolverName: string; cached?: boolean }) {
        this._resolverName = options.resolverName;
        this._configured = !options.requiresConfig;
        this._cached = options.cached ?? true;
    }

    /** Fail-early check, run before every `_resolveNative()` call. */
    protected ensureConfigured(): void {
        if (!this._configured) {
            throw new Error(
                `The ${this._resolverName} import resolver requires configuration before use. ` +
                    `Call ImportResolver.${this._resolverName}.configure({ ... }) ` +
                    `or instantiate directly: new ${this._resolverName}ImportResolver({ ... })`,
            );
        }
    }

    /**
     * Base configure — marks the resolver as configured and empties its cache.
     * Subclasses override to store their specific config, and must call `super.configure(config)`.
     */
    configure(config: TConfig): void {
        this._configured = true;
        if (config?.cacheDuration !== undefined) this._cacheDuration = config.cacheDuration;
        this.clearCache();
    }

    /** Whether this resolver has been configured (always true for resolvers without required config). */
    get isConfigured(): boolean {
        return this._configured;
    }

    // ── Resolution orchestrator ──────────────────────────────────────────

    /** The library source for `path`, from the cache or `_resolveNative()`. */
    resolve(path: string, info: ImportInfo): Promise<string | null> {
        if (!this._cached) return this._resolveUncached(info);
        const hit = this._cache.get(path);
        if (hit && Date.now() - hit.time < this._cacheDuration) return hit.source;
        const entry = { source: this._resolveUncached(info), time: Date.now() };
        this._cache.set(path, entry);
        entry.source.catch(() => {
            if (this._cache.get(path) === entry) this._cache.delete(path);
        });
        return entry.source;
    }

    /** Forget every resolved library. */
    clearCache(): void {
        this._cache.clear();
    }

    // ── Abstract methods for subclasses ─────────────────────────────────

    /**
     * Fetch a library's source. Subclasses MUST implement this. Return `null`
     * (or `undefined`) for a library this resolver does not know; throw for a
     * failure worth retrying (network error, invalid credentials).
     */
    protected abstract _resolveNative(info: ImportInfo): Promise<string | null | undefined> | string | null | undefined;

    // ── Helpers ─────────────────────────────────────────────────────────

    /** The first of `base + extension`, for each extension in turn, that `read` finds. */
    protected async firstFound(base: string, extensions: string[], read: (location: string) => Promise<string | null>): Promise<string | null> {
        for (const ext of extensions) {
            const source = await read(base + ext);
            if (source !== null) return source;
        }
        return null;
    }

    private _resolveUncached(info: ImportInfo): Promise<string | null> {
        return Promise.resolve()
            .then(() => {
                this.ensureConfigured();
                return this._resolveNative(info);
            })
            .then((source) => (typeof source === 'string' ? source : null));
    }
}
