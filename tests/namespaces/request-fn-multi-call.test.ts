// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * A user function holding a request.security, called more than once.
 *
 * The Phase 3 slice for a fn-nested call ran the script only up to the
 * function's FIRST top-level invocation. Each invocation has its own
 * path-prefixed expression name (`_fn0p3`, `_fn1p3`, …), so the secondary for
 * the second call site never evaluated its expression and the main context
 * crashed reading `secContext.params[name][idx]`
 * (`Cannot read properties of undefined`). The slice now runs through the
 * function's LAST top-level invocation; a call site whose slice still
 * doesn't evaluate the expression (e.g. the function is only reached through
 * another function) falls back to the whole script.
 */

import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';
import { transpile } from '../../src/transpiler/index';

const makePineTS = () => new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-15').getTime());

const values = (ctx: any, key: string) => ctx.plots[key].data.map((d: any) => d.value);

async function topLevel(tf: string, expr = 'close') {
    const ctx = await makePineTS().run(`//@version=5
indicator("top")
plot(request.security(syminfo.tickerid, "${tf}", ${expr}), "v")`);
    return values(ctx, 'v');
}

describe('request.security in a function called more than once', () => {
    it('two calls with different timeframes each get their own series', async () => {
        const ctx = await makePineTS().run(`//@version=5
indicator("f twice")
f(r) => request.security(syminfo.tickerid, r, close)
plot(f("240"), "a")
plot(f("D"), "b")`);
        const a = values(ctx, 'a');
        const b = values(ctx, 'b');
        expect(a).toEqual(await topLevel('240'));
        expect(b).toEqual(await topLevel('D'));
        expect(a).not.toEqual(b);
    });

    it('two calls with different sources on one timeframe each get their own series', async () => {
        const ctx = await makePineTS().run(`//@version=5
indicator("f twice src")
f(float src) => request.security(syminfo.tickerid, "240", ta.sma(src, 3))
plot(f(close), "c")
plot(f(open), "o")`);
        expect(values(ctx, 'c')).toEqual(await topLevel('240', 'ta.sma(close, 3)'));
        expect(values(ctx, 'o')).toEqual(await topLevel('240', 'ta.sma(open, 3)'));
    });

    it('a function reached only through another function falls back to the whole script', async () => {
        const ctx = await makePineTS().run(`//@version=5
indicator("nested")
f(r) => request.security(syminfo.tickerid, r, close)
g(r) => f(r)
plot(g("240"), "a")
plot(g("D"), "b")`);
        expect(values(ctx, 'a')).toEqual(await topLevel('240'));
        expect(values(ctx, 'b')).toEqual(await topLevel('D'));
    });

    it('a request behind a condition the secondary never takes settles instead of crashing', async () => {
        // The main context (60) takes the branch; the 240 secondary doesn't,
        // so it never evaluates the expression. This used to crash the same
        // way (`params[name]` undefined). The value is na for now —
        // TradingView evaluates the requested expression regardless of the
        // branch and would return the 240 closes.
        const ctx = await makePineTS().run(`//@version=5
indicator("cond")
float x = na
if timeframe.period == "60"
    x := request.security(syminfo.tickerid, "240", close)
plot(x, "x")`);
        expect(values(ctx, 'x')).toHaveLength(ctx.marketData.length);
    });

    it('the slice keeps every top-level invocation of the function', () => {
        const fn = transpile(`//@version=5
indicator("f twice")
f(r) => request.security(syminfo.tickerid, r, close)
plot(f("240"), "a")
x = 1
plot(f("D"), "b")
plot(close, "after")`) as any;
        const slices = Object.values(fn._ltfSlices ?? {}) as Function[];
        expect(slices).toHaveLength(1);
        const src = slices[0].toString();
        expect(src).toMatch(/'240'/);
        expect(src).toMatch(/'D'/);
        // Statements after the last invocation are still dropped.
        expect(src).not.toMatch(/'after'/);
    });
});
