// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
    ImportResolver,
    BaseImportResolver,
    MapImportResolver,
    FileImportResolver,
    UrlImportResolver,
    GitHubImportResolver,
    ChainImportResolver,
    FunctionImportResolver,
    resolveImports,
    type ImportInfo,
} from '../../src/imports';
import { PineTS } from '../../src/PineTS.class';
import { Indicator } from '../../src/Indicator';
import { Provider } from '../../src/marketData/Provider.class';

const info = (p: string): ImportInfo => {
    const [user, name, version] = p.split('/');
    return { path: p, user, name, version: Number(version) };
};
const resolve = (r: { resolve: (p: string, i: ImportInfo) => Promise<string | null> }, p: string) => r.resolve(p, info(p));

const lib = (name: string, body = 'export f() => 1') => `//@version=6\nlibrary("${name}")\n${body}\n`;

// A fetch stub serving `files` (url -> body); anything else is a 404.
const fakeFetch = (files: Record<string, string>, seen: { url: string; headers?: Record<string, string> }[] = []) =>
    (async (url: string, init?: { headers?: Record<string, string> }) => {
        seen.push({ url, headers: init?.headers });
        const body = files[url];
        return { ok: body !== undefined, status: body !== undefined ? 200 : 404, statusText: '', text: async () => body ?? '' };
    }) as any;

// Counts _resolveNative calls; `answer` decides each result.
class CountingResolver extends BaseImportResolver {
    calls: string[] = [];
    constructor(private readonly answer: (p: string, n: number) => Promise<string | null> | string | null) {
        super({ requiresConfig: false, resolverName: 'Counting' });
    }
    protected _resolveNative(i: ImportInfo) {
        this.calls.push(i.path);
        return this.answer(i.path, this.calls.length);
    }
}

describe('BaseImportResolver', () => {
    it('resolves each path once, concurrent requests and unknown libraries included', async () => {
        const r = new CountingResolver(async (p) => {
            await new Promise((done) => setTimeout(done, 5));
            return p === 'u/A/1' ? 'A' : null;
        });
        expect(await Promise.all([resolve(r, 'u/A/1'), resolve(r, 'u/A/1'), resolve(r, 'u/B/1')])).toEqual(['A', 'A', null]);
        expect(await resolve(r, 'u/B/1')).toBeNull();
        expect(r.calls).toEqual(['u/A/1', 'u/B/1']);
        r.clearCache();
        await resolve(r, 'u/A/1');
        expect(r.calls).toEqual(['u/A/1', 'u/B/1', 'u/A/1']);
    });

    it('asks again after an error, after cacheDuration, and after configure()', async () => {
        const r = new CountingResolver((_p, n) => {
            if (n === 1) throw new Error('network down');
            return `v${n}`;
        });
        await expect(resolve(r, 'u/A/1')).rejects.toThrow('network down');
        expect(await resolve(r, 'u/A/1')).toBe('v2');
        expect(await resolve(r, 'u/A/1')).toBe('v2');

        r.configure({ cacheDuration: 0 });
        expect(await resolve(r, 'u/A/1')).toBe('v3');
        expect(await resolve(r, 'u/A/1')).toBe('v4');
    });

    it('a resolver with required configuration fails early until configured', async () => {
        await expect(resolve(new GitHubImportResolver(), 'u/A/1')).rejects.toThrow(
            'The GitHub import resolver requires configuration before use. Call ImportResolver.GitHub.configure({ ... }) or instantiate directly: new GitHubImportResolver({ ... })',
        );
        await expect(resolve(new UrlImportResolver(), 'u/A/1')).rejects.toThrow('The Url import resolver requires configuration');
        await expect(resolve(new FileImportResolver(), 'u/A/1')).rejects.toThrow('The File import resolver requires configuration');
    });
});

describe('ImportResolver registry', () => {
    it('holds ready instances, configured like Provider', async () => {
        expect(ImportResolver.Map).toBeInstanceOf(MapImportResolver);
        expect(ImportResolver.GitHub).toBeInstanceOf(GitHubImportResolver);
        expect(ImportResolver.Url).toBeInstanceOf(UrlImportResolver);
        expect(ImportResolver.File).toBeInstanceOf(FileImportResolver);
        const map = new MapImportResolver();
        map.configure({ libraries: { 'u/A/1': 'A' } });
        expect(await resolve(map, 'u/A/1')).toBe('A');
    });
});

describe('MapImportResolver', () => {
    it('looks a library up by path, then user/name, then name', async () => {
        const r = new MapImportResolver({ libraries: { 'u/A/2': 'exact', 'u/A': 'any version', B: 'by name' } });
        expect(await resolve(r, 'u/A/2')).toBe('exact');
        expect(await resolve(r, 'u/A/3')).toBe('any version');
        expect(await resolve(r, 'x/B/1')).toBe('by name');
        expect(await resolve(r, 'x/C/1')).toBeNull();
        expect(await resolve(new MapImportResolver({ libraries: new Map([['u/A/1', 'map']]) }), 'u/A/1')).toBe('map');
    });

    it('sees sources added later, and no inherited object properties', async () => {
        const libraries: Record<string, string> = {};
        const r = new MapImportResolver({ libraries });
        expect(await resolve(r, 'u/A/1')).toBeNull();
        libraries['u/A/1'] = 'added';
        expect(await resolve(r, 'u/A/1')).toBe('added');
        expect(await resolve(r, 'u/constructor/1')).toBeNull();
    });
});

describe('ChainImportResolver', () => {
    it('returns the first source found, functions accepted', async () => {
        const order: string[] = [];
        const r = new ChainImportResolver({
            resolvers: [
                (p) => (order.push('function'), p === 'u/A/1' ? 'from function' : null),
                new CountingResolver(() => (order.push('remote'), 'from remote')),
            ],
        });
        expect(await resolve(r, 'u/A/1')).toBe('from function');
        expect(await resolve(r, 'u/B/1')).toBe('from remote');
        expect(order).toEqual(['function', 'function', 'remote']);
    });
});

describe('UrlImportResolver', () => {
    it('fills the placeholders; a 404 is an unknown library, other errors throw', async () => {
        const seen: any[] = [];
        const fetch = fakeFetch({ 'https://x.test/u/A/7.pine': 'A source' }, seen);
        const r = new UrlImportResolver({ url: 'https://x.test/{user}/{name}/{version}.pine', headers: { 'X-Key': 'k' }, fetch });
        expect(await resolve(r, 'u/A/7')).toBe('A source');
        expect(seen[0].headers).toEqual({ 'X-Key': 'k' });
        expect(await resolve(r, 'u/B/7')).toBeNull();

        const failing = new UrlImportResolver({
            url: 'https://x.test/{path}',
            fetch: (async () => ({ ok: false, status: 500, statusText: 'Server Error', text: async () => '' })) as any,
        });
        await expect(resolve(failing, 'u/A/1')).rejects.toThrow('Failed to fetch https://x.test/u/A/1: 500 Server Error');
    });
});

describe('GitHubImportResolver', () => {
    it('reads a public repository folder from raw.githubusercontent.com, trying the extensions', async () => {
        const seen: any[] = [];
        const fetch = fakeFetch({ 'https://raw.githubusercontent.com/acme/pine-libs/master/Libraries/ta.pine': 'ta source' }, seen);
        const r = new GitHubImportResolver({ url: 'https://github.com/acme/pine-libs/tree/master/Libraries', fetch });
        expect(await resolve(r, 'TradingView/ta/14')).toBe('ta source');
        expect(seen.map((s) => s.url)).toEqual([
            'https://raw.githubusercontent.com/acme/pine-libs/master/Libraries/ta',
            'https://raw.githubusercontent.com/acme/pine-libs/master/Libraries/ta.pine',
        ]);
    });

    it('uses the contents API with a token, the default branch when no ref is given', async () => {
        const seen: any[] = [];
        const fetch = fakeFetch({ 'https://api.github.com/repos/acme/pine-libs/contents/AllTimeHighLow': 'ath' }, seen);
        const r = new GitHubImportResolver({ owner: 'acme', repo: 'pine-libs', token: 'secret', fetch });
        expect(await resolve(r, 'PineCoders/AllTimeHighLow/1')).toBe('ath');
        expect(seen[0].headers).toMatchObject({ Authorization: 'Bearer secret', Accept: 'application/vnd.github.raw' });
    });

    it('configure() adds to the configuration', async () => {
        const seen: any[] = [];
        const r = new GitHubImportResolver({ url: 'https://github.com/acme/pine-libs/tree/main/libs', fetch: fakeFetch({}, seen) });
        r.configure({ token: 'secret', ref: 'v2' });
        await resolve(r, 'u/A/1');
        expect(seen[0].url).toBe('https://api.github.com/repos/acme/pine-libs/contents/libs/A?ref=v2');
        expect(seen[0].headers.Authorization).toBe('Bearer secret');
    });

    it('a file URL serves the library named after the file only', async () => {
        const seen: any[] = [];
        const fetch = fakeFetch({ 'https://raw.githubusercontent.com/acme/pine-libs/master/Libraries/Signals': 'signals' }, seen);
        const r = new GitHubImportResolver({ url: 'https://github.com/acme/pine-libs/blob/master/Libraries/Signals', fetch });
        expect(await resolve(r, 'acme/Signals/1')).toBe('signals');
        expect(await resolve(r, 'acme/ta/1')).toBeNull();
        expect(seen).toHaveLength(1);
    });

    it('accepts path templates and raw file URLs, and rejects other URLs', async () => {
        const seen: any[] = [];
        const fetch = fakeFetch({}, seen);
        await resolve(
            new GitHubImportResolver({ owner: 'o', repo: 'r', ref: 'v2', path: 'libs/{user}/{name}_v{version}.pine', extensions: [''], fetch }),
            'u/A/3',
        );
        await resolve(new GitHubImportResolver({ url: 'https://raw.githubusercontent.com/o/r/main/x/A.pine', fetch }), 'u/A/3');
        expect(seen.map((s) => s.url)).toEqual([
            'https://raw.githubusercontent.com/o/r/v2/libs/u/A_v3.pine',
            'https://raw.githubusercontent.com/o/r/main/x/A.pine',
        ]);
        expect(() => new GitHubImportResolver({ url: 'https://gitlab.com/o/r' })).toThrow('Not a GitHub repository URL');
        expect(() => new GitHubImportResolver({ url: 'https://github.com/o/r/issues/1' })).toThrow('Unsupported GitHub URL');
    });
});

describe('FileImportResolver', () => {
    it('reads a library from a folder, with or without an extension, or from a path template', async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pinets-libs-'));
        try {
            fs.writeFileSync(path.join(dir, 'Signals'), 'signals');
            fs.writeFileSync(path.join(dir, 'ta.txt'), 'ta');
            fs.mkdirSync(path.join(dir, 'u'));
            fs.writeFileSync(path.join(dir, 'u', 'A-2.pine'), 'A2');
            const r = new FileImportResolver({ dir });
            expect(await resolve(r, 'acme/Signals/6')).toBe('signals');
            expect(await resolve(r, 'TradingView/ta/14')).toBe('ta');
            expect(await resolve(r, 'a/missing/1')).toBeNull();
            const template = new FileImportResolver({ dir: path.join(dir, '{user}', '{name}-{version}.pine'), extensions: [''] });
            expect(await resolve(template, 'u/A/2')).toBe('A2');
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });
});

describe('resolveImports', () => {
    it("collects the script's imports and theirs", async () => {
        const sources: Record<string, string> = {
            'u/A/1': lib('A', 'import u/B/1 as b\nexport f() => b.g()'),
            'u/B/1': lib('B', 'export g() => 1'),
        };
        const requested: (string | undefined)[][] = [];
        const libraries = await resolveImports(`//@version=6\nindicator("x")\nimport u/A/1 as a\nplot(a.f())\n`, (p, i) => {
            requested.push([p, i.importer]);
            return sources[p];
        });
        expect(libraries).toEqual(sources);
        expect(requested).toEqual([
            ['u/A/1', undefined],
            ['u/B/1', 'u/A/1'],
        ]);
    });

    it("tolerates a library's own unknown import, not the script's", async () => {
        const A = lib('A', 'import u/Gone/1 as g\nexport f() => 1');
        expect(await resolveImports(`//@version=6\nindicator("x")\nimport u/A/1 as a\n`, (p) => (p === 'u/A/1' ? A : null))).toEqual({ 'u/A/1': A });
        await expect(resolveImports(`//@version=6\nindicator("x")\nimport u/Gone/1 as g\n`, () => null)).rejects.toThrow(
            'Import "u/Gone/1" could not be resolved',
        );
    });

    it('needs no resolver without imports', async () => {
        expect(await resolveImports(`//@version=6\nindicator("x")\nplot(close)\n`, null)).toEqual({});
        expect(await resolveImports(`($) => { const { close } = $.data; }`, null)).toEqual({});
    });
});

describe('PineTS.setImportResolver', () => {
    const makePineTS = () => new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-02').getTime());
    const script = `//@version=6\nindicator("x")\nimport u/A/1 as a\nplot(a.f(), "f")\n`;
    const last = (ctx: any) => ctx.plots['f'].data.at(-1).value;

    it('a function is wrapped once: each library is fetched once across runs', async () => {
        let requests = 0;
        const pineTS = makePineTS();
        pineTS.setImportResolver(() => (requests++, lib('A', 'export f() => 41 + 1')));
        for (let i = 0; i < 3; i++) expect(last(await pineTS.run(script))).toBe(42);
        expect(requests).toBe(1);
    });

    it('instances sharing a resolver share its cache', async () => {
        let requests = 0;
        const shared = new FunctionImportResolver(() => (requests++, lib('A', 'export f() => 7')));
        const a = makePineTS();
        const b = makePineTS();
        a.setImportResolver(shared);
        b.setImportResolver(shared);
        expect(last(await a.run(script))).toBe(7);
        expect(last(await b.run(script))).toBe(7);
        expect(requests).toBe(1);
    });

    it("an Indicator run with another resolver links that resolver's libraries", async () => {
        const ind = new Indicator(script);
        const a = makePineTS();
        a.setImportResolver(new MapImportResolver({ libraries: { 'u/A/1': lib('A', 'export f() => 1') } }));
        expect(last(await a.run(ind))).toBe(1);
        const b = makePineTS();
        b.setImportResolver(new MapImportResolver({ libraries: { 'u/A/1': lib('A', 'export f() => 2') } }));
        expect(last(await b.run(ind))).toBe(2);
        expect(last(await a.run(ind))).toBe(1);
    });
});
