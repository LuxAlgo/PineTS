// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { BaseImportResolver } from '../BaseImportResolver';
import type { IImportResolver, ImportInfo, ImportResolverFn } from '../IImportResolver';

/**
 * A plain function `(path, info) => source | null` as an import resolver, with
 * the caching of `BaseImportResolver`. `PineTS.setImportResolver` wraps a
 * function it is given in one of these.
 *
 * ```typescript
 * pineTS.setImportResolver(async (path, { name }) => {
 *     const res = await fetch(`https://my-server/libraries/${name}`);
 *     return res.ok ? res.text() : null;
 * });
 * ```
 */
export class FunctionImportResolver extends BaseImportResolver {
    constructor(private readonly _fn: ImportResolverFn) {
        super({ requiresConfig: false, resolverName: 'Function' });
    }

    protected _resolveNative(info: ImportInfo) {
        return this._fn(info.path, info);
    }
}

/** An import resolver, or a plain function wrapped as one. */
export function toImportResolver(resolver: IImportResolver | ImportResolverFn): IImportResolver {
    return typeof resolver === 'function' ? new FunctionImportResolver(resolver) : resolver;
}
