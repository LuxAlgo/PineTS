// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { BaseImportResolver } from '../BaseImportResolver';
import type { BaseImportResolverConfig, IImportResolver, ImportInfo, ImportResolverFn } from '../IImportResolver';
import { toImportResolver } from '../Function/FunctionImportResolver.class';

/** Configuration for ChainImportResolver. */
export interface ChainImportResolverConfig extends BaseImportResolverConfig {
    /** Resolvers asked in turn; the first source found wins. */
    resolvers?: (IImportResolver | ImportResolverFn)[];
}

/**
 * Asks several resolvers in turn; the first source found wins. Each resolver
 * keeps its own cache, so the chain itself does not cache.
 *
 * ```typescript
 * pineTS.setImportResolver(
 *     new ChainImportResolver({
 *         resolvers: [
 *             new MapImportResolver({ libraries: { 'PineCoders/AllTimeHighLow/1': athSource } }),
 *             new GitHubImportResolver({ url: 'https://github.com/acme/pine-libraries/tree/main/libraries', token }),
 *         ],
 *     })
 * );
 * ```
 */
export class ChainImportResolver extends BaseImportResolver<ChainImportResolverConfig> {
    private _resolvers: IImportResolver[] = [];

    constructor(config?: ChainImportResolverConfig) {
        super({ requiresConfig: false, resolverName: 'Chain', cached: false });
        if (config) {
            this.configure(config);
        }
    }

    configure(config: ChainImportResolverConfig): void {
        super.configure(config);
        if (config.resolvers) {
            this._resolvers = config.resolvers.map(toImportResolver);
        }
    }

    protected async _resolveNative(info: ImportInfo): Promise<string | null> {
        for (const resolver of this._resolvers) {
            const source = await resolver.resolve(info.path, info);
            if (typeof source === 'string') return source;
        }
        return null;
    }
}
