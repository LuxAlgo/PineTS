// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import type { ImportInfo } from './IImportResolver';

/** The subset of `fetch` the URL-based resolvers use; pass your own to run without a global `fetch`. */
export type FetchFn = (
    url: string,
    init?: { headers?: Record<string, string> },
) => Promise<{ ok: boolean; status: number; statusText?: string; text(): Promise<string> }>;

/** Replace the `{path}`, `{user}`, `{name}` and `{version}` placeholders with the import's values. */
export function fillTemplate(template: string, info: ImportInfo): string {
    return template.replace(/\{(path|user|name|version)\}/g, (_, key: 'path' | 'user' | 'name' | 'version') => String(info[key]));
}

/** Body of a successful response, `null` on 404; other statuses throw. */
export async function fetchText(fetchFn: FetchFn | undefined, url: string, headers?: Record<string, string>): Promise<string | null> {
    const f = fetchFn ?? (globalThis as any).fetch;
    if (typeof f !== 'function') throw new Error('No fetch implementation available: pass one in the resolver config');
    const response = await f(url, headers ? { headers } : undefined);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText ?? ''}`.trim());
    return response.text();
}
