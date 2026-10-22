// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { BaseImportResolver } from '../BaseImportResolver';
import type { BaseImportResolverConfig, ImportInfo } from '../IImportResolver';
import { fetchText, fillTemplate, type FetchFn } from '../utils';

/** Configuration for GitHubImportResolver. */
export interface GitHubImportResolverConfig extends BaseImportResolverConfig {
    /**
     * Where the libraries are: a repository URL, a folder URL (`/tree/<ref>/<folder>`),
     * or a file URL (`/blob/<ref>/<file>`, or raw.githubusercontent.com) serving the
     * library named after the file. Alternatively, give `owner` / `repo` / `ref` / `path`.
     */
    url?: string;
    owner?: string;
    repo?: string;
    /** Branch, tag or commit; the default branch when omitted. */
    ref?: string;
    /**
     * Where a library's file is in the repository: a folder (the file being the
     * library name) or a template with `{user}`, `{name}`, `{version}` and `{path}`
     * placeholders (`pine/{name}/v{version}.pine`). The repository root by default.
     */
    path?: string;
    /** Access token, for private repositories (and GitHub's higher API rate limit). */
    token?: string;
    /** Suffixes tried in turn after a folder / template path. Default `['', '.pine']`. */
    extensions?: string[];
    /** `fetch` implementation; the global one by default. */
    fetch?: FetchFn;
}

interface GitHubLocation {
    owner: string;
    repo: string;
    ref?: string;
    path?: string;
    file?: string;
}

/**
 * Library sources read from a GitHub repository. Public repositories are read
 * from raw.githubusercontent.com; with a `token`, the GitHub contents API is
 * used, which also serves private repositories. A 404 means "unknown library".
 *
 * Library versions are not part of the default file path: a repository usually
 * holds the latest version of each library only. Use a `path` template with
 * `{version}`, or a `ref`, to serve older ones.
 *
 * ## Usage
 *
 * ### Direct instantiation:
 * ```typescript
 * const github = new GitHubImportResolver({ url: 'https://github.com/acme/pine-libraries/tree/main/libraries', token });
 * pineTS.setImportResolver(github);
 * ```
 *
 * ### Via ImportResolver registry:
 * ```typescript
 * ImportResolver.GitHub.configure({ url: 'https://github.com/acme/pine-libraries/tree/main/libraries', token });
 * pineTS.setImportResolver(ImportResolver.GitHub);
 * ```
 */
export class GitHubImportResolver extends BaseImportResolver<GitHubImportResolverConfig> {
    private _location: GitHubLocation | null = null;
    private _token: string | undefined;
    private _extensions = ['', '.pine'];
    private _fetch: FetchFn | undefined;

    constructor(config?: GitHubImportResolverConfig) {
        super({ requiresConfig: true, resolverName: 'GitHub' });
        if (config?.url || config?.owner) {
            this.configure(config);
        }
    }

    configure(config: GitHubImportResolverConfig): void {
        super.configure(config);
        if (config.url !== undefined) this._location = parseGitHubUrl(config.url);
        if (config.owner !== undefined || config.repo !== undefined) {
            this._location = { ...(this._location ?? { owner: '', repo: '' }), file: undefined };
            if (config.owner !== undefined) this._location.owner = config.owner;
            if (config.repo !== undefined) this._location.repo = config.repo;
        }
        if (this._location) {
            if (config.ref !== undefined) this._location.ref = config.ref;
            if (config.path !== undefined) this._location.path = config.path;
        }
        if (config.token !== undefined) this._token = config.token;
        if (config.extensions) this._extensions = config.extensions;
        if (config.fetch !== undefined) this._fetch = config.fetch;
    }

    protected _resolveNative(info: ImportInfo): Promise<string | null> {
        const loc = this._location;
        if (!loc?.owner || !loc.repo) throw new Error('The GitHub import resolver has no repository configured (url, or owner and repo)');
        if (loc.file) {
            const fileName = loc.file
                .split('/')
                .pop()
                ?.replace(/\.[^.]*$/, '');
            return info.name === fileName ? this._get(loc, loc.file) : Promise.resolve(null);
        }
        const template = loc.path ? (loc.path.includes('{') ? loc.path : `${loc.path.replace(/\/+$/, '')}/{name}`) : '{name}';
        return this.firstFound(fillTemplate(template, info), this._extensions, (path) => this._get(loc, path));
    }

    private _get(loc: GitHubLocation, path: string): Promise<string | null> {
        const encoded = path.split('/').map(encodeURIComponent).join('/');
        if (this._token) {
            const url = `https://api.github.com/repos/${loc.owner}/${loc.repo}/contents/${encoded}${loc.ref ? `?ref=${encodeURIComponent(loc.ref)}` : ''}`;
            return fetchText(this._fetch, url, {
                Accept: 'application/vnd.github.raw',
                Authorization: `Bearer ${this._token}`,
                'X-GitHub-Api-Version': '2022-11-28',
            });
        }
        return fetchText(this._fetch, `https://raw.githubusercontent.com/${loc.owner}/${loc.repo}/${loc.ref ?? 'HEAD'}/${encoded}`);
    }
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
