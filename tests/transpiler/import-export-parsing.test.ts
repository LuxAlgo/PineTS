// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { describe, it, expect } from 'vitest';
import { pineToJS } from '../../src/transpiler/pineToJS/pineToJS.index';
import { scanImports, parseImportPath } from '../../src/transpiler/pineToJS/imports';
import { transpile } from '../../src/transpiler/index';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

describe('import statement', () => {
    it('parses the path, version and alias', () => {
        const r: any = pineToJS(`//@version=6
indicator("x")
import PineCoders/AllTimeHighLow/1 as allTime
import TradingView/ta/14
plot(close)
`);
        expect(r.success).toBe(true);
        expect(r.imports).toEqual([
            { path: 'PineCoders/AllTimeHighLow/1', user: 'PineCoders', name: 'AllTimeHighLow', version: 1, alias: 'allTime' },
            // without `as`, the library name is the namespace
            { path: 'TradingView/ta/14', user: 'TradingView', name: 'ta', version: 14, alias: 'ta' },
        ]);
        // not linked without library sources
        expect(r.unresolvedImports.map((s: any) => s.path)).toEqual(['PineCoders/AllTimeHighLow/1', 'TradingView/ta/14']);
    });

    it('accepts user names with characters that lex as operators', () => {
        expect(scanImports(`//@version=6\nindicator("x")\nimport some-user.x/Lib_2/12 as l\n`)[0]).toMatchObject({
            user: 'some-user.x',
            name: 'Lib_2',
            version: 12,
        });
    });

    it('rejects a path that is not user/library/version', () => {
        expect(() => parseImportPath('TradingView/ta')).toThrow(/Invalid import path "TradingView\/ta"/);
        expect(() => parseImportPath('TradingView/ta/v7')).toThrow(/Invalid import path/);
        const r: any = pineToJS(`//@version=6\nindicator("x")\nimport TradingView/ta as t\n`);
        expect(r.success).toBe(false);
        expect(r.error).toMatch(/Invalid import path "TradingView\/ta"/);
    });

    it('is only allowed in the global scope', () => {
        const r: any = pineToJS(`//@version=6
indicator("x")
if true
    import TradingView/ta/14 as t
`);
        expect(r.success).toBe(false);
        expect(r.error).toMatch(/"import" is only allowed in the global scope/);
    });

    it('fails to transpile when the library source is not provided', () => {
        expect(() => transpile(`//@version=6\nindicator("x")\nimport u/Lib/1 as l\nplot(l.f())\n`)).toThrow(
            /Unresolved Pine Script import: "u\/Lib\/1"/,
        );
    });

    it('scanImports ignores comments, strings and keywords used as names', () => {
        const specs = scanImports(`//@version=6
indicator("x")
// import u/Commented/1 as c
s = "import u/InString/1"
import u/Real/1 as r
`);
        expect(specs.map((s) => s.path)).toEqual(['u/Real/1']);
    });
});

describe('export declarations', () => {
    const lib = `//@version=6
library("Lib", overlay = true)
export type point
    float x
export enum Dir
    up
    down
export method len(point p) => math.abs(p.x)
export float twice(float v) => v * 2
export ema2(series float src, simple int length) =>
    float ema2 = ta.ema(src, length)
    ema2
plot(twice(close))
`;

    it('parse functions, methods, types and enums', () => {
        const r: any = pineToJS(lib);
        expect(r.success).toBe(true);
        const exported = r.ast.body.filter((n: any) => n.exported).map((n: any) => n.id?.name ?? n.name ?? n.declarations?.[0]?.id?.name);
        expect(exported).toEqual(['point', 'Dir', 'len', 'twice', 'ema2']);
    });

    it('keep a variable named like an exported function apart from it', () => {
        // `float ema2 = ta.ema(...)` inside `export ema2(...)`: the variable must not shadow the function
        const r: any = pineToJS(lib);
        expect(r.code).toMatch(/let ema2_var = ta\.ema\(src, length\)/);
    });

    it('reject anything else', () => {
        const r: any = pineToJS(`//@version=6\nlibrary("x")\nexport x = 1\n`);
        expect(r.success).toBe(false);
        expect(r.error).toMatch(/Only functions, methods, types and enums can be exported/);
    });

    it('a library runs on its own, like an indicator', async () => {
        const ctx = await new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-02').getTime()).run(
            lib,
        );
        const data = ctx.plots[Object.keys(ctx.plots)[0]].data;
        expect(data.at(-1).value).toBeCloseTo(ctx.data.close.get(0) * 2, 8);
        expect((ctx as any).indicator).toMatchObject({ title: 'Lib', overlay: true });
    });
});
