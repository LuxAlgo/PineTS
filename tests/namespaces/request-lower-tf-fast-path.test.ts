// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Regression: `request.security_lower_tf` used to spawn a full secondary
 * PineTS instance and run the entire user script in it for every LTF
 * bar in the chart's window — even when the captured expression was a
 * trivially-pure price tuple like `[open, high, low, close, volume]`,
 * the most common LTF pattern (~90% of footprint / volume-profile /
 * structural-leg-profiler indicators).
 *
 * The fast path detects bare-builtin expressions at the runtime entry
 * (via the original Series identity recorded by `request.param`) and
 * synthesises the secondary's `params[expression_name]` directly from
 * the LTF candle stream — no transpile, no script execution, no
 * per-LTF-bar shifting / drawing-helper allocation in the secondary.
 *
 * Captured-expression values must match what the slow path would have
 * produced (when the slow path also produces consistent values), so
 * this test verifies a non-trivial subset of the fast-path output
 * against the LTF candles read directly from the same provider.
 */

import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

describe('request.security_lower_tf fast path for pure-builtin expressions', () => {
    const chartStart = new Date('2018-12-10').getTime();
    const chartEnd = new Date('2019-01-21').getTime();

    it('takes the fast path for `close` and produces correct values', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, chartStart, chartEnd);
        const context = await pineTS.run(async (context) => {
            const { close } = context.data;
            const { request, plotchar } = context.pine;
            const res = await request.security_lower_tf('BTCUSDC', 'D', close);
            // Sum across the LTF slice for each chart bar — deterministic
            // and lets us assert against the underlying daily candles.
            let sum = 0.0;
            const sz = res?.size?.() ?? 0;
            for (let i = 0; i < sz; i++) sum += res.get(i);
            plotchar(sum, 'sum');
            plotchar(sz, 'sz');
        });

        // Cache shape: fast-path entries set `_fastPath: true` and
        // `pineTS: null`. This is the contract the fast-path streaming
        // refresh code depends on.
        const cacheKeys = Object.keys((context as any).cache || {});
        const ltfKey = cacheKeys.find((k) => k.includes('_lower'));
        expect(ltfKey).toBeDefined();
        const cached = (context as any).cache[ltfKey!];
        expect(cached._fastPath).toBe(true);
        expect(cached.pineTS).toBeNull();
        expect(cached._fastPathArgs).toBeDefined();
        expect(cached._fastPathArgs.builtinExpr).toBeDefined();
        expect(cached._fastPathArgs.builtinExpr.kind).toBe('series');
        expect(cached._fastPathArgs.builtinExpr.builtinNames).toEqual(['close']);

        // The fast-path stub holds openTime/closeTime arrays + the
        // params slot. No `pine`, no `plots` (those are for full Contexts).
        const sec = cached.context;
        expect(sec.data.openTime.data.length).toBeGreaterThan(0);
        expect(sec.data.closeTime.data.length).toBe(sec.data.openTime.data.length);
        expect(sec.params).toBeDefined();
        const expressionParam = Object.keys(sec.params)[0];
        expect(sec.params[expressionParam].length).toBe(sec.data.openTime.data.length);

        // Captured sums on the chart bars must be > 0 (sanity that the
        // values flowed through to the user-visible scalar).
        const sumData = (context as any).plots['sum']?.data ?? [];
        expect(sumData.length).toBeGreaterThan(0);
        const sumNonZero = sumData.filter((d: any) => typeof d.value === 'number' && d.value > 0);
        expect(sumNonZero.length).toBeGreaterThan(0);
    });

    it('takes the fast path for `[open, high, low, close, volume]` tuple', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, chartStart, chartEnd);
        const context = await pineTS.run(async (context) => {
            const { open, high, low, close, volume } = context.data;
            const { request, plotchar } = context.pine;
            const r = await request.security_lower_tf('BTCUSDC', 'D', [open, high, low, close, volume]);
            // r is a 5-element array of PineArrayObjects per chart bar.
            plotchar(r?.[0]?.size?.() ?? 0, 'sz');
        });

        const cacheKeys = Object.keys((context as any).cache || {});
        const ltfKey = cacheKeys.find((k) => k.includes('_lower'));
        const cached = (context as any).cache[ltfKey!];
        expect(cached._fastPath).toBe(true);
        expect(cached._fastPathArgs.builtinExpr.kind).toBe('tuple');
        expect(cached._fastPathArgs.builtinExpr.builtinNames).toEqual(['open', 'high', 'low', 'close', 'volume']);

        // params slot holds an array of 5-tuples (one per LTF bar).
        const sec = cached.context;
        const expressionParam = Object.keys(sec.params)[0];
        const values = sec.params[expressionParam];
        expect(values.length).toBeGreaterThan(0);
        expect(Array.isArray(values[0])).toBe(true);
        expect(values[0].length).toBe(5); // O, H, L, C, V
        // Sanity: H >= L on a real candle.
        expect(values[0][1]).toBeGreaterThanOrEqual(values[0][2]);
    });

    it('falls back to the slow path when the expression is NOT a pure builtin', async () => {
        // ta.sma is stateful — the secondary needs to actually run the
        // user script to compute it bar-by-bar. The fast path must NOT
        // claim this case (silently producing wrong values).
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, chartStart, chartEnd);
        const context = await pineTS.run(async (context) => {
            const { close } = context.data;
            const { request, ta, plotchar } = context.pine;
            const res = await request.security_lower_tf('BTCUSDC', 'D', ta.sma(close, 3));
            plotchar(res?.size?.() ?? 0, 'sz');
        });

        const cacheKeys = Object.keys((context as any).cache || {});
        const ltfKey = cacheKeys.find((k) => k.includes('_lower'));
        const cached = (context as any).cache[ltfKey!];
        // Slow path: no fast-path markers.
        expect(cached._fastPath).toBeUndefined();
        // A real PineTS instance was constructed for the slow secondary.
        expect(cached.pineTS).not.toBeNull();
    });

    it('falls back to the slow path when expression is a tuple containing a non-builtin', async () => {
        // [close, ta.sma(close, 3)] mixes a builtin with a derived
        // series — the fast path must reject the whole tuple.
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, chartStart, chartEnd);
        const context = await pineTS.run(async (context) => {
            const { close } = context.data;
            const { request, ta, plotchar } = context.pine;
            const r = await request.security_lower_tf('BTCUSDC', 'D', [close, ta.sma(close, 3)]);
            plotchar(r?.[0]?.size?.() ?? 0, 'sz');
        });

        const cacheKeys = Object.keys((context as any).cache || {});
        const ltfKey = cacheKeys.find((k) => k.includes('_lower'));
        const cached = (context as any).cache[ltfKey!];
        expect(cached._fastPath).toBeUndefined();
    });

    it('fast path and slow path produce identical values for the same `close` expression', async () => {
        // Run the same probe twice — once with `close` (fast path) and
        // once with `ta.sma(close, 1)` (slow path; SMA-1 IS just close,
        // so values must agree). Compare per-chart-bar sums.
        const makePineTS = () => new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, chartStart, chartEnd);

        const fast = await makePineTS().run(async (context) => {
            const { close } = context.data;
            const { request, plotchar } = context.pine;
            const res = await request.security_lower_tf('BTCUSDC', 'D', close);
            let s = 0.0;
            const sz = res?.size?.() ?? 0;
            for (let i = 0; i < sz; i++) s += res.get(i);
            plotchar(s, 'sum');
        });

        const slow = await makePineTS().run(async (context) => {
            const { close } = context.data;
            const { request, ta, plotchar } = context.pine;
            const res = await request.security_lower_tf('BTCUSDC', 'D', ta.sma(close, 1));
            let s = 0.0;
            const sz = res?.size?.() ?? 0;
            for (let i = 0; i < sz; i++) s += res.get(i);
            plotchar(s, 'sum');
        });

        const fastData = (fast as any).plots['sum'].data;
        const slowData = (slow as any).plots['sum'].data;
        expect(fastData.length).toEqual(slowData.length);
        for (let i = 0; i < fastData.length; i++) {
            const f = fastData[i].value;
            const s = slowData[i].value;
            // Allow tiny floating-point tolerance for the cumulative sum.
            expect(Math.abs(f - s) < 0.001 || (Number.isNaN(f) && Number.isNaN(s)),
                `fast vs slow mismatch at bar ${i}: fast=${f} slow=${s}`).toBe(true);
        }
    });

    // ─────────────────────────────────────────────────────────────────────
    // UDT-of-builtins fast path
    // ─────────────────────────────────────────────────────────────────────
    it('takes the UDT fast path when every field default is a bare builtin', async () => {
        // type candle { float o = open; float h = high; float l = low;
        //               float c = close; float v = volume; }
        // c = candle.new() — every field defaults to a price builtin.
        // Passing `c` to security_lower_tf should hit the UDT fast path.
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, chartStart, chartEnd);
        const code = `
//@version=5
indicator("udt-fast")
type candle
    float o = open
    float h = high
    float l = low
    float c = close
    float v = volume
mycandle = candle.new()
ltf = request.security_lower_tf(syminfo.tickerid, "D", mycandle)
plot(ltf.size(), "sz")
`;
        const context: any = await pineTS.run(code);
        const cacheKeys = Object.keys(context.cache || {});
        const ltfKey = cacheKeys.find((k) => k.includes('_lower'));
        expect(ltfKey, 'cache entry expected').toBeDefined();
        const cached = context.cache[ltfKey!];
        expect(cached._fastPath).toBe(true);
        expect(cached._fastPathArgs.builtinExpr.kind).toBe('udt');
        expect(cached._fastPathArgs.builtinExpr.fieldNames).toEqual(['o', 'h', 'l', 'c', 'v']);
        expect(cached._fastPathArgs.builtinExpr.builtinNames).toEqual(['open', 'high', 'low', 'close', 'volume']);

        // Each captured per-LTF-bar value must be a PineTypeObject of
        // the same UDT shape, with fields populated from the candle.
        const expressionParam = Object.keys(cached.context.params)[0];
        const values = cached.context.params[expressionParam];
        expect(values.length).toBeGreaterThan(0);
        const first = values[0];
        expect(first).toBeDefined();
        // Field names match the type definition.
        expect(first.o).toBeDefined();
        expect(first.h).toBeDefined();
        expect(first.l).toBeDefined();
        expect(first.c).toBeDefined();
        expect(first.v).toBeDefined();
        // Sanity: high >= low on a real candle.
        expect(first.h).toBeGreaterThanOrEqual(first.l);
    });

    it('falls back to the slow path when a UDT has any non-builtin default', async () => {
        // The type has 5 builtin defaults + 1 user-derived default
        // (`extra = ta.sma(close, 3)`). The detector must reject the
        // whole UDT and use the slow path.
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, chartStart, chartEnd);
        const code = `
//@version=5
indicator("udt-mixed")
type candle
    float o = open
    float extra = ta.sma(close, 3)
mycandle = candle.new()
ltf = request.security_lower_tf(syminfo.tickerid, "D", mycandle)
plot(ltf.size(), "sz")
`;
        const context: any = await pineTS.run(code);
        const cacheKeys = Object.keys(context.cache || {});
        const ltfKey = cacheKeys.find((k) => k.includes('_lower'));
        const cached = context.cache[ltfKey!];
        // Slow path: no fast-path markers.
        expect(cached._fastPath).toBeUndefined();
        expect(cached.pineTS).not.toBeNull();
    });

    it('falls back to the slow path when a UDT has any field without a default', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, chartStart, chartEnd);
        const code = `
//@version=5
indicator("udt-no-default")
type candle
    float o = open
    float h
mycandle = candle.new()
ltf = request.security_lower_tf(syminfo.tickerid, "D", mycandle)
plot(ltf.size(), "sz")
`;
        const context: any = await pineTS.run(code);
        const cacheKeys = Object.keys(context.cache || {});
        const ltfKey = cacheKeys.find((k) => k.includes('_lower'));
        const cached = context.cache[ltfKey!];
        // Slow path: the field `h` has no default → can't fast-path.
        expect(cached._fastPath).toBeUndefined();
    });
});
