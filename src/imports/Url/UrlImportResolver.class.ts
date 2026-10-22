// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { BaseImportResolver } from '../BaseImportResolver';
import type { BaseImportResolverConfig, ImportInfo } from '../IImportResolver';
import { fetchText, fillTemplate, type FetchFn } from '../utils';

/** Configuration for UrlImportResolver. */
export interface UrlImportResolverConfig extends BaseImportResolverConfig {
    /** URL of a library, with `{user}`, `{name}`, `{version}` and `{path}` placeholders, or a function building it. */
    url: string | ((info: ImportInfo) => string);
    /** Request headers (authorization, ...). */
    headers?: Record<string, string>;
    /** `fetch` implementation; the global one by default. */
    fetch?: FetchFn;
}

/**
 * Library sources fetched over HTTP. A 404 response means "unknown library";
 * other error statuses throw.
 *
 * ## Usage
 *
 * ### Direct instantiation:
 * ```typescript
 * pineTS.setImportResolver(new UrlImportResolver({ url: 'https://example.com/pine/{user}/{name}/{version}.pine' }));
 * ```
 *
 * ### Via ImportResolver registry:
 * ```typescript
 * ImportResolver.Url.configure({ url: 'https://example.com/pine/{name}.pine', headers: { Authorization: `Bearer ${token}` } });
 * pineTS.setImportResolver(ImportResolver.Url);
 * ```
 */
export class UrlImportResolver extends BaseImportResolver<UrlImportResolverConfig> {
    private _url: UrlImportResolverConfig['url'] | null = null;
    private _headers: Record<string, string> | undefined;
    private _fetch: FetchFn | undefined;

    constructor(config?: UrlImportResolverConfig) {
        super({ requiresConfig: true, resolverName: 'Url' });
        if (config?.url) {
            this.configure(config);
        }
    }

    configure(config: UrlImportResolverConfig): void {
        super.configure(config);
        if (config.url !== undefined) this._url = config.url;
        if (config.headers !== undefined) this._headers = config.headers;
        if (config.fetch !== undefined) this._fetch = config.fetch;
    }

    protected _resolveNative(info: ImportInfo): Promise<string | null> {
        const url = this._url;
        if (!url) throw new Error('The Url import resolver has no "url" configured');
        return fetchText(this._fetch, typeof url === 'function' ? url(info) : fillTemplate(url, info), this._headers);
    }
}
