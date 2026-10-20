// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ImportResolver, CachedImportResolver, resolveImports, type ImportInfo } from '../../src/imports';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

const info = (p: string): ImportInfo => {
    const [user, name, version] = p.split('/');
    return { path: p, user, name, version: Number(version) };
};

const lib = (name: string, body = 'export f() => 1') => `//@version=6\nlibrary("${name}")\n${body}\n`;

// A fetch stub serving `files` (url -> body); anything else is a 404.
const fakeFetch = (files: Record<string, string>, seen: { url: string; headers?: Record<string, string> }[] = []) =>
    (async (url: string, init?: { headers?: Record<string, string> }) => {
        seen.push({ url, headers: init?.headers });
        const body = files[url];
        return { ok: body !== undefined, status: body !== undefined ? 200 : 404, statusText: '', text: async () => body ?? '' };
    }) as any;

describe('ImportResolver.fromMap', () => {
    it('looks a library up by path, then user/name, then name', async () => {
        const r = ImportResolver.fromMap({ 'u/A/2': 'exact', 'u/A': 'any version', B: 'by name' });
        expect(await r('u/A/2', info('u/A/2'))).toBe('exact');
        expect(await r('u/A/3', info('u/A/3'))).toBe('any version');
        expect(await r('x/B/1', info('x/B/1'))).toBe('by name');
        expect(await r('x/C/1', info('x/C/1'))).toBeNull();
        expect(await ImportResolver.fromMap(new Map([['u/A/1', 'map']]))('u/A/1', info('u/A/1'))).toBe('map');
    });

    it('does not read inherited object properties', async () => {
        expect(await ImportResolver.fromMap({})('u/constructor/1', info('u/constructor/1'))).toBeNull();
    });
});

describe('CachedImportResolver', () => {
    it('calls the resolver once per path, concurrent requests included', async () => {
        const calls: string[] = [];
        const cached = new CachedImportResolver(async (p) => {
            calls.push(p);
            await new Promise((r) => setTimeout(r, 5));
            return p === 'u/A/1' ? 'A' : null;
        });
        const results = await Promise.all([
            cached.resolve('u/A/1', info('u/A/1')),
            cached.resolve('u/A/1', info('u/A/1')),
            cached.resolve('u/B/1', info('u/B/1')),
        ]);
        expect(results).toEqual(['A', 'A', null]);
        expect(await cached.resolve('u/B/1', info('u/B/1'))).toBeNull();
        expect(calls).toEqual(['u/A/1', 'u/B/1']);
        cached.clear();
        await cached.resolve('u/A/1', info('u/A/1'));
        expect(calls).toEqual(['u/A/1', 'u/B/1', 'u/A/1']);
    });

    it('calls a resolver that threw again', async () => {
        let n = 0;
        const cached = new CachedImportResolver({
            resolve: () => {
                if (n++ === 0) throw new Error('network down');
                return 'A';
            },
        });
        await expect(cached.resolve('u/A/1', info('u/A/1'))).rejects.toThrow('network down');
        expect(await cached.resolve('u/A/1', info('u/A/1'))).toBe('A');
    });
});

describe('ImportResolver.chain', () => {
    it('returns the first source found', async () => {
        const order: string[] = [];
        const r = ImportResolver.chain((p) => (order.push('map'), p === 'u/A/1' ? 'from map' : null), {
            resolve: async () => (order.push('remote'), 'from remote'),
        });
        expect(await r('u/A/1', info('u/A/1'))).toBe('from map');
        expect(await r('u/B/1', info('u/B/1'))).toBe('from remote');
        expect(order).toEqual(['map', 'map', 'remote']);
    });
});

describe('ImportResolver.fromUrl', () => {
    it('fills the placeholders; a 404 is an unknown library, other errors throw', async () => {
        const seen: any[] = [];
        const fetch = fakeFetch({ 'https://x.test/u/A/7.pine': 'A source' }, seen);
        const r = ImportResolver.fromUrl('https://x.test/{user}/{name}/{version}.pine', { headers: { 'X-Key': 'k' }, fetch });
        expect(await r('u/A/7', info('u/A/7'))).toBe('A source');
        expect(seen[0].headers).toEqual({ 'X-Key': 'k' });
        expect(await r('u/B/7', info('u/B/7'))).toBeNull();

        const failing = ImportResolver.fromUrl('https://x.test/{path}', {
            fetch: (async () => ({ ok: false, status: 500, statusText: 'Server Error', text: async () => '' })) as any,
        });
        await expect(failing('u/A/1', info('u/A/1'))).rejects.toThrow('Failed to fetch https://x.test/u/A/1: 500 Server Error');
    });
});

describe('ImportResolver.fromGitHub', () => {
    it('reads a public repository folder from raw.githubusercontent.com, trying the extensions', async () => {
        const seen: any[] = [];
        const fetch = fakeFetch({ 'https://raw.githubusercontent.com/acme/pine-libs/master/Libraries/ta.pine': 'ta source' }, seen);
        const r = ImportResolver.fromGitHub('https://github.com/acme/pine-libs/tree/master/Libraries', { fetch });
        expect(await r('TradingView/ta/14', info('TradingView/ta/14'))).toBe('ta source');
        expect(seen.map((s) => s.url)).toEqual([
            'https://raw.githubusercontent.com/acme/pine-libs/master/Libraries/ta',
            'https://raw.githubusercontent.com/acme/pine-libs/master/Libraries/ta.pine',
        ]);
    });

    it('uses the contents API with a token, the default branch when no ref is given', async () => {
        const seen: any[] = [];
        const fetch = fakeFetch({ 'https://api.github.com/repos/acme/pine-libs/contents/AllTimeHighLow': 'ath' }, seen);
        const r = ImportResolver.fromGitHub({ owner: 'acme', repo: 'pine-libs' }, { token: 'secret', fetch });
        expect(await r('PineCoders/AllTimeHighLow/1', info('PineCoders/AllTimeHighLow/1'))).toBe('ath');
        expect(seen[0].headers).toMatchObject({ Authorization: 'Bearer secret', Accept: 'application/vnd.github.raw' });
    });

    it('a file URL serves the library named after the file only', async () => {
        const seen: any[] = [];
        const fetch = fakeFetch({ 'https://raw.githubusercontent.com/acme/pine-libs/master/Libraries/Signals': 'signals' }, seen);
        const r = ImportResolver.fromGitHub('https://github.com/acme/pine-libs/blob/master/Libraries/Signals', { fetch });
        expect(await r('acme/Signals/1', info('acme/Signals/1'))).toBe('signals');
        expect(await r('acme/ta/1', info('acme/ta/1'))).toBeNull();
        expect(seen).toHaveLength(1);
    });

    it('accepts path templates and raw file URLs, and rejects other URLs', async () => {
        const seen: any[] = [];
        const fetch = fakeFetch({}, seen);
        await ImportResolver.fromGitHub(
            { owner: 'o', repo: 'r', ref: 'v2', path: 'libs/{user}/{name}_v{version}.pine' },
            { fetch, extensions: [''] },
        )('u/A/3', info('u/A/3'));
        await ImportResolver.fromGitHub('https://raw.githubusercontent.com/o/r/main/x/A.pine', { fetch })('u/A/3', info('u/A/3'));
        expect(seen.map((s) => s.url)).toEqual([
            'https://raw.githubusercontent.com/o/r/v2/libs/u/A_v3.pine',
            'https://raw.githubusercontent.com/o/r/main/x/A.pine',
        ]);
        expect(() => ImportResolver.fromGitHub('https://gitlab.com/o/r')).toThrow('Not a GitHub repository URL');
        expect(() => ImportResolver.fromGitHub('https://github.com/o/r/issues/1')).toThrow('Unsupported GitHub URL');
    });
});

describe('ImportResolver.fromFiles', () => {
    it('reads a library from a folder, with or without an extension', async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pinets-libs-'));
        try {
            fs.writeFileSync(path.join(dir, 'Signals'), 'signals');
            fs.writeFileSync(path.join(dir, 'ta.txt'), 'ta');
            fs.mkdirSync(path.join(dir, 'u'));
            fs.writeFileSync(path.join(dir, 'u', 'A-2.pine'), 'A2');
            const r = ImportResolver.fromFiles(dir);
            expect(await r('acme/Signals/6', info('acme/Signals/6'))).toBe('signals');
            expect(await r('TradingView/ta/14', info('TradingView/ta/14'))).toBe('ta');
            expect(await r('a/missing/1', info('a/missing/1'))).toBeNull();
            expect(
                await ImportResolver.fromFiles(path.join(dir, '{user}', '{name}-{version}.pine'), { extensions: [''] })('u/A/2', info('u/A/2')),
            ).toBe('A2');
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
    it('fetches each library once across runs', async () => {
        let requests = 0;
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-02').getTime());
        pineTS.setImportResolver(() => (requests++, lib('A', 'export f() => 41 + 1')));
        const script = `//@version=6\nindicator("x")\nimport u/A/1 as a\nplot(a.f(), "f")\n`;
        for (let i = 0; i < 3; i++) {
            const ctx = await pineTS.run(script);
            expect(ctx.plots['f'].data.at(-1).value).toBe(42);
        }
        expect(requests).toBe(1);
    });
});
