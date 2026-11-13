// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import type { ImportInfo } from './IImportResolver';
import { PineRuntimeError } from '../errors/PineRuntimeError';
import { MAX_COMPILER_SOURCE_BYTES, assertCompilerSourceBudget } from '../transpiler/analysis/CompilerBudget';

/** The subset of `fetch` the URL-based resolvers use; pass your own to run without a global `fetch`. */
export type FetchFn = (
    url: string,
    init?: { headers?: Record<string, string>; signal?: AbortSignal },
) => Promise<{
    ok: boolean;
    status: number;
    statusText?: string;
    headers?: { get(name: string): string | null };
    body?: { getReader(): { read(): Promise<{ done: boolean; value?: Uint8Array }>; cancel(): Promise<unknown>; releaseLock(): void } } | null;
    text(): Promise<string>;
}>;

/** Replace the `{path}`, `{user}`, `{name}` and `{version}` placeholders with the import's values. */
export function fillTemplate(template: string, info: ImportInfo): string {
    return template.replace(/\{(path|user|name|version)\}/g, (_, key: 'path' | 'user' | 'name' | 'version') => String(info[key]));
}

/** Body of a successful response, `null` on 404; other statuses throw. */
export async function fetchText(fetchFn: FetchFn | undefined, url: string, headers?: Record<string, string>, signal?: AbortSignal): Promise<string | null> {
    const f = fetchFn ?? (globalThis as any).fetch;
    if (typeof f !== 'function') throw new Error('No fetch implementation available: pass one in the resolver config');
    const response = await f(url, headers || signal ? { headers, signal } : undefined);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText ?? ''}`.trim());
    const contentLength = Number(response.headers?.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_COMPILER_SOURCE_BYTES) {
        throw new PineRuntimeError('Pine compilation budget exceeded: source bytes.', 'compiler.budget', 'RESOURCE_LIMIT');
    }
    if (!response.body?.getReader) {
        const source = await response.text();
        assertCompilerSourceBudget(source);
        return source;
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const chunks: string[] = [];
    let bytes = 0;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            bytes += value?.byteLength ?? 0;
            if (bytes > MAX_COMPILER_SOURCE_BYTES) {
                await reader.cancel();
                throw new PineRuntimeError('Pine compilation budget exceeded: source bytes.', 'compiler.budget', 'RESOURCE_LIMIT');
            }
            chunks.push(decoder.decode(value, { stream: true }));
        }
        chunks.push(decoder.decode());
    } finally {
        reader.releaseLock();
    }
    const source = chunks.join('');
    assertCompilerSourceBudget(source);
    return source;
}
