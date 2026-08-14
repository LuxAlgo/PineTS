// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * `request.security` (HTF) slow-path slicing — Phase 4.
 *
 * Phase 4 extends the slicing optimization to the HTF runtime:
 * `security_lower_tf` and `security` share the same transpile-time
 * slice walker (driven by `SLICING_TARGETS`) and the same runtime
 * lookup pattern (`context._ltfTruncatedBodies[sliceKey]` →
 * `pineTS.runPretranspiled(slice)`).
 *
 * These tests focus on the Phase 4-specific bits that wouldn't be
 * caught by the LTF tests:
 *
 *   - Slices are emitted for `request.security` (not just
 *     `request.security_lower_tf`).
 *   - The runtime slow path in `security.ts` engages the slice when
 *     present.
 *   - Phase 2 + 3 walkers also fire for HTF call sites.
 *
 * Output-equivalence (Phase 4 vs full-script slow path) is covered by
 * the `request-htf-pre-phase4.test.ts` suite.
 */

import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';
import { transpile } from '../../src/transpiler/index';

const chartStart = new Date('2018-12-15').getTime();
const chartEnd = new Date('2019-02-15').getTime();
const HTF = 'W';

const makePineTS = (tf: string = 'D') =>
    new PineTS(Provider.Mock, 'BTCUSDC', tf, null, chartStart, chartEnd);

describe('request.security (HTF) slicing — Phase 4', () => {
    // ─────────────────────────────────────────────────────────────────────
    // Codegen: slices ARE emitted for request.security calls
    // ─────────────────────────────────────────────────────────────────────
    it('emits a slice for a top-level `request.security` call (Phase 1 shape)', () => {
        const code = `
//@version=5
indicator("htf top")
htf = request.security(syminfo.tickerid, "${HTF}", ta.sma(close, 5))
plot(htf, "htf")
`;
        const fn = transpile(code) as any;
        expect(fn._ltfSlices).toBeDefined();
        const keys = Object.keys(fn._ltfSlices);
        expect(keys.length).toBeGreaterThan(0);
        for (const k of keys) expect(/^p\d+$/.test(k)).toBe(true);
        // The slice must mention request.security and DROP the post-call
        // plot.
        const sliceFn = Object.values(fn._ltfSlices)[0] as Function;
        const src = sliceFn.toString();
        expect(src).toMatch(/request\.security/);
        expect(src).not.toMatch(/'htf'/);
    });

    it('emits a slice for a `request.security` call inside an if-block (Phase 2 shape)', () => {
        const code = `
//@version=5
indicator("htf if")
var float captured = na
if bar_index % 2 == 0
    captured := request.security(syminfo.tickerid, "${HTF}", ta.sma(close, 3))
plot(captured, "captured")
`;
        const fn = transpile(code) as any;
        const sliceFn = Object.values(fn._ltfSlices ?? {})[0] as Function;
        expect(sliceFn).toBeDefined();
        const src = sliceFn.toString();
        expect(src).toMatch(/request\.security/);
        // The if-cond must survive the slice.
        expect(src).toMatch(/if\s*\(/);
        // The post-if `plot` must NOT survive.
        expect(src).not.toMatch(/'captured'/);
    });

    it('emits a slice for a `request.security` call inside a user fn (Phase 3 shape)', () => {
        const code = `
//@version=5
indicator("htf fn")
fetch(float src) =>
    request.security(syminfo.tickerid, "${HTF}", ta.sma(src, 4))
htf = fetch(close)
plot(htf, "htf")
`;
        const fn = transpile(code) as any;
        const sliceFn = Object.values(fn._ltfSlices ?? {})[0] as Function;
        expect(sliceFn).toBeDefined();
        const src = sliceFn.toString();
        expect(src).toMatch(/function\s+fetch/);
        expect(src).toMatch(/\$\.call\(fetch/);
        expect(src).toMatch(/request\.security/);
        // Post-call plot dropped.
        expect(src).not.toMatch(/'htf'/);
    });

    it('emits independent slices for an HTF + LTF call in the same script', () => {
        const code = `
//@version=5
indicator("mixed")
htf = request.security(syminfo.tickerid, "${HTF}", ta.sma(close, 3))
ltf = request.security_lower_tf(syminfo.tickerid, "60", ta.rsi(close, 7))
plot(htf, "htf")
plot(ltf.size(), "ltfSz")
`;
        const fn = transpile(code) as any;
        const slices = fn._ltfSlices ?? {};
        const keys = Object.keys(slices);
        expect(keys.length).toBe(2);
        // Each slice has a different key (different pN per call site).
        const [first, second] = keys.map((k) => (slices[k] as Function).toString());
        // first slice covers only request.security (not request.security_lower_tf yet).
        expect(first).toMatch(/request\.security\(/);
        expect(first).not.toMatch(/request\.security_lower_tf/);
        // second slice covers both calls (its prefix includes the first).
        expect(second).toMatch(/request\.security\(/);
        expect(second).toMatch(/request\.security_lower_tf/);
    });

    // ─────────────────────────────────────────────────────────────────────
    // Runtime: secondary uses the slice instead of the full script
    // ─────────────────────────────────────────────────────────────────────
    it('runtime: HTF secondary context uses the slice (not a full-script run)', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=5
indicator("htf runtime")
htf = request.security(syminfo.tickerid, "${HTF}", ta.sma(close, 3))
plot(htf, "htf")
`;
        const ctx: any = await pineTS.run(code);
        // Slice present.
        expect(ctx._ltfTruncatedBodies).toBeDefined();
        expect(Object.keys(ctx._ltfTruncatedBodies).length).toBeGreaterThan(0);
        // The HTF cache entry's secondary uses the slice as its
        // transpiled function — `runPretranspiled` reuses the slice
        // function for `_transpiledCode`.
        const cacheKey = Object.keys(ctx.cache).find((k) => k.includes('BTCUSDC') && !k.includes('_lower'))!;
        const cached = ctx.cache[cacheKey];
        expect(cached.pineTS).not.toBeNull();
        const secTranspiled = (cached.pineTS as any).transpiledCode;
        const sliceFn = Object.values(ctx._ltfTruncatedBodies)[0];
        expect(secTranspiled).toBe(sliceFn);
    });

    it('runtime: HTF fn-nested call uses the slice (Phase 3 + Phase 4 composition)', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=5
indicator("htf fn runtime")
fetch(float src) =>
    request.security(syminfo.tickerid, "${HTF}", ta.sma(src, 4))
htf = fetch(close)
plot(htf, "htf")
`;
        const ctx: any = await pineTS.run(code);
        expect(ctx._ltfTruncatedBodies).toBeDefined();
        const sliceFn = Object.values(ctx._ltfTruncatedBodies)[0];
        const cacheKey = Object.keys(ctx.cache).find((k) => k.includes('BTCUSDC') && !k.includes('_lower'))!;
        const cached = ctx.cache[cacheKey];
        // Path-prefix stripping: at runtime _expression_name is
        // `${$$.id}p3`, but the slice is keyed by `p3`. The hook strips
        // the prefix → the lookup hits → the slice fires.
        const secTranspiled = (cached.pineTS as any).transpiledCode;
        expect(secTranspiled).toBe(sliceFn);
    });
});
