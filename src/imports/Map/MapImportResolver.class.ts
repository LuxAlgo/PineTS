// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { BaseImportResolver } from '../BaseImportResolver';
import type { BaseImportResolverConfig, ImportInfo } from '../IImportResolver';

/** Configuration for MapImportResolver. */
export interface MapImportResolverConfig extends BaseImportResolverConfig {
    /**
     * Library sources, keyed by full import path (`user/library/version`),
     * `user/library` (any version) or library name alone, looked up in that order.
     */
    libraries?: Record<string, string> | Map<string, string>;
}

/**
 * Library sources held in memory.
 *
 * ## Usage
 *
 * ### Direct instantiation:
 * ```typescript
 * pineTS.setImportResolver(new MapImportResolver({ libraries: { 'PineCoders/AllTimeHighLow/1': athSource, ta: taSource } }));
 * ```
 *
 * ### Via ImportResolver registry:
 * ```typescript
 * ImportResolver.Map.configure({ libraries: { 'PineCoders/AllTimeHighLow/1': athSource } });
 * pineTS.setImportResolver(ImportResolver.Map);
 * ```
 *
 * Lookups are not cached: a source added to the `libraries` object later is found.
 */
export class MapImportResolver extends BaseImportResolver<MapImportResolverConfig> {
    private _libraries: Record<string, string> | Map<string, string> = {};

    constructor(config?: MapImportResolverConfig) {
        super({ requiresConfig: false, resolverName: 'Map', cached: false });
        if (config) {
            this.configure(config);
        }
    }

    configure(config: MapImportResolverConfig): void {
        super.configure(config);
        if (config.libraries) {
            this._libraries = config.libraries;
        }
    }

    protected _resolveNative(info: ImportInfo): string | null {
        return this._get(info.path) ?? this._get(`${info.user}/${info.name}`) ?? this._get(info.name) ?? null;
    }

    private _get(key: string): string | undefined {
        const libraries = this._libraries;
        if (libraries instanceof Map) return libraries.get(key);
        return Object.prototype.hasOwnProperty.call(libraries, key) ? libraries[key] : undefined;
    }
}
