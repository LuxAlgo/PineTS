// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

// Ready-made import resolvers. Any function `(path, info) => source` is a
// resolver too; these cover the common sources of library code.

import type { ImportInfo, ImportResolverFn, ImportResolverLike } from './types';

type FetchFn = (
    url: string,
    init?: { headers?: Record<string, string> },
) => Promise<{ ok: boolean; status: number; statusText?: string; text(): Promise<string> }>;

const fill = (template: string, info: ImportInfo) =>
    template.replace(/\{(path|user|name|version)\}/g, (_, key: keyof ImportInfo) => String(info[key]));

const callResolver = (resolver: ImportResolverLike, path: string, info: ImportInfo) =>
    typeof resolver === 'function' ? resolver(path, info) : resolver.resolve(path, info);

/** Body of a successful response, `null` on 404. */
async function fetchText(fetchFn: FetchFn | undefined, url: string, headers?: Record<string, string>): Promise<string | null> {
    const f = fetchFn ?? (globalThis as any).fetch;
    if (typeof f !== 'function') throw new Error('No fetch implementation available: pass one in the resolver options');
    const response = await f(url, headers ? { headers } : undefined);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText ?? ''}`.trim());
    return response.text();
}

/**
 * Library sources held in memory. A source is looked up by its full import
 * path (`user/library/version`), then by `user/library` (any version), then by
 * the library name alone.
 *
 *     ImportResolver.fromMap({ 'PineCoders/AllTimeHighLow/1': athSource, ta: taSource })
 */
function fromMap(libraries: Record<string, string> | Map<string, string>): ImportResolverFn {
    const get = (key: string) =>
        libraries instanceof Map ? libraries.get(key) : Object.prototype.hasOwnProperty.call(libraries, key) ? libraries[key] : undefined;
    return (path, info) => get(path) ?? get(`${info.user}/${info.name}`) ?? get(info.name) ?? null;
}

/**
 * Fetch each library from a URL. A string URL may hold the placeholders
 * `{user}`, `{name}`, `{version}` and `{path}`; a 404 means "unknown library".
 *
 *     ImportResolver.fromUrl('https://example.com/pine/{user}/{name}/{version}.pine')
 */
function fromUrl(
    url: string | ((info: ImportInfo) => string),
    options: { headers?: Record<string, string>; fetch?: FetchFn } = {},
): ImportResolverFn {
    return (_path, info) => fetchText(options.fetch, typeof url === 'function' ? url(info) : fill(url, info), options.headers);
}

export interface GitHubLocation {
    owner: string;
    repo: string;
    /** Branch, tag or commit; the default branch when omitted. */
    ref?: string;
    /**
     * Where a library's file is in the repository: a folder (`Libraries`, the
     * file being the library name) or a template with `{user}`, `{name}`,
     * `{version}` placeholders (`pine/{name}.pine`). The repository root by default.
     */
    path?: string;
    /** A single library file: it serves the library whose name is the file name. */
    file?: string;
}

export interface GitHubOptions {
    /** Access token, for private repositories (and GitHub's higher API rate limit). */
    token?: string;
    /** Branch, tag or commit, overriding the one in the location. */
    ref?: string;
    /** Suffixes tried in turn after a folder / template path. Default `['', '.pine']`. */
    extensions?: string[];
    fetch?: FetchFn;
}

/** `https://github.com/<owner>/<repo>[/tree|blob/<ref>/<path>]` or `https://raw.githubusercontent.com/<owner>/<repo>/<ref>/<file>`. */
function parseGitHubUrl(url: string): GitHubLocation {
    const m = url
        .trim()
        .match(/^(?:https?:\/\/)?(?:www\.)?(github\.com|raw\.githubusercontent\.com)\/([^/]+)\/([^/#?]+)(?:\/(.*?))?\/?(?:[?#].*)?$/i);
    if (!m) throw new Error(`Not a GitHub repository URL: "${url}"`);
    const [, host, owner, rawRepo, rest = ''] = m;
    const repo = rawRepo.replace(/\.git$/, '');
    const parts = rest.split('/').filter(Boolean).map(decodeURIComponent);
    if (host.toLowerCase() === 'raw.githubusercontent.com') {
        if (parts.length < 2) throw new Error(`A raw.githubusercontent.com URL must point to a file: "${url}"`);
        return { owner, repo, ref: parts[0], file: parts.slice(1).join('/') };
    }
    if (parts.length === 0) return { owner, repo };
    if ((parts[0] === 'tree' || parts[0] === 'blob') && parts.length >= 2) {
        const location: GitHubLocation = { owner, repo, ref: parts[1] };
        const path = parts.slice(2).join('/');
        if (parts[0] === 'blob') location.file = path;
        else if (path) location.path = path;
        return location;
    }
    throw new Error(`Unsupported GitHub URL: "${url}". Use a repository, folder (/tree/...) or file (/blob/...) URL`);
}

/**
 * Fetch libraries from a GitHub repository, given a repository / folder / file
 * URL or a location object. Public repositories are read from
 * raw.githubusercontent.com; with a `token`, the GitHub contents API is used,
 * which also serves private repositories.
 *
 *     ImportResolver.fromGitHub('https://github.com/acme/pine-libraries/tree/main/libraries', { token })
 *
 * Library versions are not part of the default file path: a repository usually
 * holds the latest version of each library only.
 */
function fromGitHub(location: string | GitHubLocation, options: GitHubOptions = {}): ImportResolverFn {
    const loc = typeof location === 'string' ? parseGitHubUrl(location) : location;
    const ref = options.ref ?? loc.ref;
    const extensions = options.extensions ?? ['', '.pine'];
    const template = loc.path ? (loc.path.includes('{') ? loc.path : `${loc.path.replace(/\/+$/, '')}/{name}`) : '{name}';
    const fileName = loc.file
        ?.split('/')
        .pop()
        ?.replace(/\.[^.]*$/, '');

    const get = (path: string) => {
        const encoded = path.split('/').map(encodeURIComponent).join('/');
        if (options.token) {
            const url = `https://api.github.com/repos/${loc.owner}/${loc.repo}/contents/${encoded}${ref ? `?ref=${encodeURIComponent(ref)}` : ''}`;
            return fetchText(options.fetch, url, {
                Accept: 'application/vnd.github.raw',
                Authorization: `Bearer ${options.token}`,
                'X-GitHub-Api-Version': '2022-11-28',
            });
        }
        return fetchText(options.fetch, `https://raw.githubusercontent.com/${loc.owner}/${loc.repo}/${ref ?? 'HEAD'}/${encoded}`);
    };

    return async (_path, info) => {
        if (loc.file) return info.name === fileName ? get(loc.file) : null;
        const base = fill(template, info);
        for (const ext of extensions) {
            const source = await get(base + ext);
            if (source !== null) return source;
        }
        return null;
    };
}

/**
 * Read libraries from local files (Node.js only). `dir` is a folder holding
 * one file per library, named after it, or a path template with `{user}`,
 * `{name}`, `{version}` placeholders.
 *
 *     ImportResolver.fromFiles('./pine/libraries')
 */
function fromFiles(dir: string, options: { extensions?: string[] } = {}): ImportResolverFn {
    const extensions = options.extensions ?? ['', '.pine', '.txt'];
    return async (_path, info) => {
        let fs: any;
        try {
            // A computed specifier keeps bundlers from pulling `fs` into browser builds.
            const specifier = 'node:fs/promises';
            fs = await import(/* @vite-ignore */ specifier);
        } catch {
            throw new Error('ImportResolver.fromFiles is only available in Node.js');
        }
        const base = dir.includes('{') ? fill(dir, info) : `${dir.replace(/[\\/]+$/, '')}/${info.name}`;
        for (const ext of extensions) {
            try {
                return await fs.readFile(base + ext, 'utf8');
            } catch (e) {
                if (!['ENOENT', 'EISDIR', 'ENOTDIR'].includes((e as any)?.code)) throw e;
            }
        }
        return null;
    };
}

/** Ask each resolver in turn; the first source returned wins. */
function chain(...resolvers: ImportResolverLike[]): ImportResolverFn {
    return async (path, info) => {
        for (const resolver of resolvers) {
            const source = await callResolver(resolver, path, info);
            if (typeof source === 'string') return source;
        }
        return null;
    };
}

/**
 * Built-in import resolvers, for `pineTS.setImportResolver(...)`.
 *
 *     pineTS.setImportResolver(
 *         ImportResolver.chain(
 *             ImportResolver.fromMap({ 'PineCoders/AllTimeHighLow/1': athSource }),
 *             ImportResolver.fromGitHub('https://github.com/acme/pine-libraries/tree/main/libraries', { token }),
 *         )
 *     );
 */
export const ImportResolver = { fromMap, fromUrl, fromGitHub, fromFiles, chain };
