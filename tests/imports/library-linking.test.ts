// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Libraries imported with `import user/library/version as alias` behave as if
 * their code were part of the script: each call site keeps its own state, and
 * nothing collides with the script's own names. Expected values come from the
 * same computation written directly in the script, or by hand.
 */

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';
import { MapImportResolver } from '../../src/imports';
import { transpile } from '../../src/transpiler/index';

const makePineTS = (libraries: Record<string, string>, eDate = '2024-01-05') => {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date(eDate).getTime());
    pineTS.setImportResolver(new MapImportResolver({ libraries }));
    return pineTS;
};
const series = (ctx: any, title: string) => ctx.plots[title].data.map((d: any) => d.value);
const expectSameSeries = (actual: number[], expected: number[]) => {
    expect(actual.length).toBe(expected.length);
    actual.forEach((v, i) => {
        if (Number.isNaN(expected[i])) expect(v).toBeNaN();
        else expect(v).toBeCloseTo(expected[i], 8);
    });
};

const MATH_LIB = `//@version=6
library("MathLib")

export enum State
    long = 'Long'
    short = 'Short'

export type point
    float x
    float y = 1.0

SCALE = 2

scaled(float v) => v * SCALE

// private, on a built-in receiver type
method describe(string s) => str.length(s) * 10

export method norm(point p) => math.sqrt(p.x * p.x + p.y * p.y)

export smooth(series float src, simple int len) =>
    float e = ta.ema(src, len)
    scaled(e)

export counter() =>
    var int n = 0
    n += 1
    n

export label(string s) => s.describe()

export stateOf(float v) => v > 0 ? State.long : State.short

export weighted(float a, float b = 2, float c = 3) => a + b * 10 + c * 100

// not exported
hidden() => 42

plot(smooth(close, 3))
`;

describe('imported library', () => {
    it('functions keep separate state per call site', async () => {
        const ctx = await makePineTS({ 'me/MathLib/1': MATH_LIB }).run(`//@version=6
indicator("main")
import me/MathLib/1 as m
plot(m.smooth(close, 9), "fast")
plot(m.smooth(close, 21), "slow")
plot(ta.ema(close, 9) * 2, "ref fast")
plot(ta.ema(close, 21) * 2, "ref slow")
plot(m.counter() + 1000 * m.counter(), "counters")
`);
        expectSameSeries(series(ctx, 'fast'), series(ctx, 'ref fast'));
        expectSameSeries(series(ctx, 'slow'), series(ctx, 'ref slow'));
        // two independent `var` counters: n + 1000 * n on bar n
        series(ctx, 'counters').forEach((v: number, i: number) => expect(v).toBe(1001 * (i + 1)));
    });

    it('types, enums and methods', async () => {
        const ctx = await makePineTS({ 'me/MathLib/1': MATH_LIB }).run(`//@version=6
indicator("main")
import me/MathLib/1 as m
m.point p = m.point.new(3, 4)
m.State st = m.stateOf(close - open)
plot(p.norm(), "dot syntax")
plot(m.norm(p), "alias syntax")
plot(m.point.new(6).y, "field default")
plot(st == m.State.long ? 1 : 0, "state")
plot(close > open ? 1 : 0, "ref state")
plot(m.label("abc"), "private method")
`);
        expect(series(ctx, 'dot syntax').at(-1)).toBe(5);
        expect(series(ctx, 'alias syntax').at(-1)).toBe(5);
        expect(series(ctx, 'field default').at(-1)).toBe(1);
        expectSameSeries(series(ctx, 'state'), series(ctx, 'ref state'));
        expect(series(ctx, 'private method').at(-1)).toBe(30);
    });

    it('named arguments, defaults included', async () => {
        const ctx = await makePineTS({ 'me/MathLib/1': MATH_LIB }).run(`//@version=6
indicator("main")
import me/MathLib/1 as m
plot(m.weighted(1), "defaults")
plot(m.weighted(1, c = 5), "skips b")
plot(m.weighted(c = 0, a = 7, b = 1), "all named")
`);
        expect(series(ctx, 'defaults').at(-1)).toBe(1 + 20 + 300);
        expect(series(ctx, 'skips b').at(-1)).toBe(1 + 20 + 500);
        expect(series(ctx, 'all named').at(-1)).toBe(7 + 10 + 0);
    });

    it("does not collide with the script's own names", async () => {
        const ctx = await makePineTS({ 'me/MathLib/1': MATH_LIB }).run(`//@version=6
indicator("main")
import me/MathLib/1 as m
// same names as the library's: a function, a private method, a global, a type
scaled(float v) => v + 0.5
method describe(string s) => str.length(s)
SCALE = 100
type point
    float x = 7
plot(scaled(1), "own function")
plot("abcd".describe(), "own method")
plot(m.label("abcd"), "library method")
plot(SCALE, "own global")
plot(point.new().x, "own type")
plot(m.point.new(1, 1).x, "library type")
`);
        expect(series(ctx, 'own function').at(-1)).toBe(1.5);
        expect(series(ctx, 'own method').at(-1)).toBe(4);
        expect(series(ctx, 'library method').at(-1)).toBe(40);
        expect(series(ctx, 'own global').at(-1)).toBe(100);
        expect(series(ctx, 'own type').at(-1)).toBe(7);
        expect(series(ctx, 'library type').at(-1)).toBe(1);
    });

    it('links only what the script reaches', () => {
        const code = transpile(
            `//@version=6
indicator("main")
import me/MathLib/1 as m
plot(m.counter())
`,
            { debug: false, libraries: { 'me/MathLib/1': MATH_LIB } },
        ).toString();
        expect(code).toContain('me$MathLib$1$counter');
        // unused declarations and the library's own script code are left out
        expect(code).not.toContain('smooth');
        expect(code).not.toContain('hidden');
        expect(code).not.toContain('SCALE');
    });

    it('an alias named like a built-in namespace keeps the built-ins', async () => {
        const TA_LIB = `//@version=6
library("ta")
export dema(series float src, simple int len) =>
    float e1 = ta.ema(src, len)
    2 * e1 - ta.ema(e1, len)
`;
        const ctx = await makePineTS({ 'TradingView/ta/14': TA_LIB }).run(`//@version=6
indicator("main")
import TradingView/ta/14
e = ta.ema(close, 10)
plot(ta.dema(close, 10), "library")
plot(2 * e - ta.ema(e, 10), "built-ins")
`);
        expectSameSeries(series(ctx, 'library'), series(ctx, 'built-ins'));
    });

    it('imported enums work in input.enum()', async () => {
        const ctx = await makePineTS({ 'me/MathLib/1': MATH_LIB }).run(`//@version=6
indicator("main")
import me/MathLib/1 as m
m.State choice = input.enum(m.State.short, "Side")
plot(choice == m.State.short ? 1 : 0, "short")
`);
        expect(series(ctx, 'short').at(-1)).toBe(1);
    });
});

describe('nested imports', () => {
    const BASE = `//@version=6
library("Base")
export add(float a, float b) => a + b
export type pair
    float a
    float b
`;
    const MID = `//@version=6
library("Mid")
import me/Base/1 as base
export sumPair(base.pair p) => base.add(p.a, p.b)
export makePair(float a, float b) => base.pair.new(a, b)
export needsMissing() => missing.f()
import me/Missing/1 as missing
`;

    it('resolve through the importing library, each library linked once', async () => {
        const ctx = await makePineTS({ 'me/Base/1': BASE, 'me/Mid/1': MID }).run(`//@version=6
indicator("main")
import me/Mid/1 as mid
import me/Base/1 as b
p = mid.makePair(2, 3)
plot(mid.sumPair(p), "via mid")
plot(b.add(10, 1), "direct")
`);
        expect(series(ctx, 'via mid').at(-1)).toBe(5);
        expect(series(ctx, 'direct').at(-1)).toBe(11);
    });

    it('an unresolved import of a library only matters when the script reaches it', async () => {
        const libraries = { 'me/Base/1': BASE, 'me/Mid/1': MID };
        const ok = await makePineTS(libraries).run(
            `//@version=6\nindicator("main")\nimport me/Mid/1 as mid\nplot(mid.sumPair(mid.makePair(1, 2)))\n`,
        );
        expect(ok.plots[Object.keys(ok.plots)[0]].data.at(-1).value).toBe(3);

        await expect(
            makePineTS(libraries).run(`//@version=6\nindicator("main")\nimport me/Mid/1 as mid\nplot(mid.needsMissing())\n`),
        ).rejects.toThrow('Library "me/Mid/1" uses missing.f() from "me/Missing/1", which could not be resolved');
    });
});

describe('import errors', () => {
    const run = (main: string, libraries: Record<string, string>) => makePineTS(libraries).run(main);

    it('a member the library does not export', async () => {
        await expect(run(`//@version=6\nindicator("x")\nimport me/MathLib/1 as m\nplot(m.hidden())\n`, { 'me/MathLib/1': MATH_LIB })).rejects.toThrow(
            'Could not find function or function reference "m.hidden": library "me/MathLib/1" does not export it',
        );
    });

    it('a script that is not a library', async () => {
        await expect(
            run(`//@version=6\nindicator("x")\nimport me/Ind/1 as i\nplot(i.f())\n`, {
                'me/Ind/1': `//@version=6\nindicator("Ind")\nexport f() => 1\n`,
            }),
        ).rejects.toThrow('"me/Ind/1" is not a library');
    });

    it('a duplicate alias', async () => {
        await expect(
            run(`//@version=6\nindicator("x")\nimport me/MathLib/1 as m\nimport me/MathLib/2 as m\nplot(close)\n`, {
                'me/MathLib/1': MATH_LIB,
                'me/MathLib/2': MATH_LIB,
            }),
        ).rejects.toThrow('Duplicate import alias "m"');
    });

    it('a circular import', async () => {
        const A = `//@version=6\nlibrary("A")\nimport me/B/1 as b\nexport f() => b.g()\n`;
        const B = `//@version=6\nlibrary("B")\nimport me/A/1 as a\nexport g() => 1\n`;
        await expect(run(`//@version=6\nindicator("x")\nimport me/A/1 as a\nplot(a.f())\n`, { 'me/A/1': A, 'me/B/1': B })).rejects.toThrow(
            'Circular library import: me/A/1 -> me/B/1 -> me/A/1',
        );
    });

    it('a library the resolver does not know', async () => {
        await expect(run(`//@version=6\nindicator("x")\nimport me/Nope/1 as n\nplot(n.f())\n`, {})).rejects.toThrow(
            'Import "me/Nope/1" could not be resolved: the import resolver returned no source',
        );
    });

    it('no resolver configured', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-02').getTime());
        await expect(pineTS.run(`//@version=6\nindicator("x")\nimport me/Nope/1 as n\nplot(n.f())\n`)).rejects.toThrow(
            'The script imports "me/Nope/1" but no import resolver is configured',
        );
    });
});

describe('request.security', () => {
    const script = `//@version=6
indicator("main")
import me/MathLib/1 as m
plot(request.security(syminfo.tickerid, "240", m.smooth(close, 5)), "htf library")
plot(request.security(syminfo.tickerid, "240", ta.ema(close, 5) * 2), "htf built-ins")
`;
    const check = (ctx: any) => {
        const lib = series(ctx, 'htf library');
        expect(lib.filter((v: number) => !Number.isNaN(v)).length).toBeGreaterThan(100);
        expectSameSeries(lib, series(ctx, 'htf built-ins'));
    };

    it('runs library code in the secondary context', async () => {
        check(await makePineTS({ 'me/MathLib/1': MATH_LIB }, '2024-01-10').run(script));
    });

    it('a secondary context running the whole script resolves the imports too, without fetching them again', async () => {
        // without slices, the secondary transpiles the full source again
        process.env.PINETS_DISABLE_LTF_SLICING = '1';
        try {
            let requests = 0;
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());
            pineTS.setImportResolver((path) => {
                requests++;
                return path === 'me/MathLib/1' ? MATH_LIB : null;
            });
            check(await pineTS.run(script));
            expect(requests).toBe(1);
        } finally {
            delete process.env.PINETS_DISABLE_LTF_SLICING;
        }
    });
});
