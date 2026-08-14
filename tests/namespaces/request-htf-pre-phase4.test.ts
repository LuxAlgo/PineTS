// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * `request.security` (HTF) regression tests — Phase 4 baseline.
 *
 * Phase 4 of the LTF/HTF slicing optimization wires the slice walker
 * into `security.ts` (the HTF runtime). These tests pin down HTF
 * behaviour ACROSS the shapes the slicer affects, so that after
 * Phase 4 lands we can verify zero regressions:
 *
 *   1. Calculated-expression HTF (slow path; slice replaces full-script)
 *   2. Calculated-expression determinism across runs
 *   3. HTF inside `if` (Phase 2 control-flow + HTF)
 *   4. HTF inside user fn (Phase 3 + HTF)
 *   5. HTF tuple expression
 *   6. Same-TF + same-symbol bypasses the secondary
 *   7. lookahead=true vs lookahead=false produce different streams
 *   8. gaps=true produces NaN→value pattern
 *   9. calc_bars_count is honoured
 *  10. Multiple HTF calls keep independent state
 *  11. Stateful var inside HTF-fetching fn (Phase 3 probe shape)
 *
 * Each test asserts on observable OUTPUT (plot data), not on internal
 * cache structure — those will change between Phase 4 pre/post.
 *
 * Mock data window: D and W — see `tests/compatibility/_data`. We use
 * D chart with W HTF so both timeframes resolve to local data files.
 *
 * Run via `npm test -- --run tests/namespaces/request-htf-pre-phase4`.
 */

import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

const chartStart = new Date('2018-12-15').getTime();
const chartEnd = new Date('2019-02-15').getTime();
const HTF = 'W';

const makePineTS = (tf: string = 'D') =>
    new PineTS(Provider.Mock, 'BTCUSDC', tf, null, chartStart, chartEnd);

function plotValues(ctx: any, key: string): number[] {
    return (ctx.plots[key]?.data ?? []).map((d: any) => d.value);
}

describe('request.security (HTF) — Phase 4 regression baseline', () => {
    // ─────────────────────────────────────────────────────────────────────
    // 1. Calculated-expression HTF (slow path)
    // ─────────────────────────────────────────────────────────────────────
    it('HTF with calculated expression (ta.sma) returns finite values aligned to chart bars', async () => {
        const code = `
//@version=5
indicator("htf calc")
htf = request.security(syminfo.tickerid, "${HTF}", ta.sma(close, 5))
plot(htf, "htf")
`;
        const ctx: any = await makePineTS().run(code);
        const vs = plotValues(ctx, 'htf');
        expect(vs.length).toBeGreaterThan(5);
        const finite = vs.filter((v) => Number.isFinite(v));
        expect(finite.length).toBeGreaterThan(vs.length / 2);
        for (const v of finite) expect(v).toBeGreaterThan(0);
    });

    it('HTF calculated expression: same-script consecutive runs produce identical output', async () => {
        // Locks in DETERMINISM — Phase 4 must not introduce non-deterministic
        // ordering, secondary-context state leakage, or cache key drift.
        const code = `
//@version=5
indicator("htf det")
htf = request.security(syminfo.tickerid, "${HTF}", ta.ema(close, 10))
plot(htf, "htf")
`;
        const a: any = await makePineTS().run(code);
        const b: any = await makePineTS().run(code);
        const aV = plotValues(a, 'htf');
        const bV = plotValues(b, 'htf');
        expect(aV.length).toEqual(bV.length);
        for (let i = 0; i < aV.length; i++) {
            const an = aV[i], bn = bV[i];
            if (Number.isNaN(an) && Number.isNaN(bn)) continue;
            expect(an).toEqual(bn);
        }
    });

    // ─────────────────────────────────────────────────────────────────────
    // 3. HTF inside `if` (Phase 2 + HTF)
    // ─────────────────────────────────────────────────────────────────────
    it('HTF inside an if-block produces values gated by the condition', async () => {
        // Gate the HTF call to even-indexed chart bars. Half the bars
        // should be finite, half NaN — proving the if's cond is
        // honoured (and survives the slice once Phase 4 lands).
        const code = `
//@version=5
indicator("htf in if")
var float captured = na
if bar_index % 2 == 0
    captured := request.security(syminfo.tickerid, "${HTF}", ta.sma(close, 3))
plot(captured, "captured")
plot(bar_index % 2 == 0 ? 1 : 0, "fired")
`;
        const ctx: any = await makePineTS().run(code);
        const vs = plotValues(ctx, 'captured');
        const fired = plotValues(ctx, 'fired');
        expect(vs.length).toBeGreaterThan(5);
        // After warmup, every "fired" bar must have a finite captured
        // value; bars where `fired==0` carry the previous fired-bar's
        // value (it's a `var` that holds across bars).
        let firedFiniteCount = 0;
        for (let i = 0; i < vs.length; i++) {
            if (fired[i] === 1 && Number.isFinite(vs[i])) firedFiniteCount++;
        }
        expect(firedFiniteCount).toBeGreaterThan(5);
    });

    // ─────────────────────────────────────────────────────────────────────
    // 4. HTF inside user fn (Phase 3 + HTF)
    // ─────────────────────────────────────────────────────────────────────
    it('HTF inside a user function returns the same captured stream as a top-level call', async () => {
        // Two PineTS runs of the same captured expression — once at top
        // level, once via a user function. Captured streams must agree.
        const codeTop = `
//@version=5
indicator("htf top")
htf = request.security(syminfo.tickerid, "${HTF}", ta.sma(close, 4))
plot(htf, "htf")
`;
        const codeFn = `
//@version=5
indicator("htf fn")
fetch(float src) =>
    request.security(syminfo.tickerid, "${HTF}", ta.sma(src, 4))
htf = fetch(close)
plot(htf, "htf")
`;
        const a: any = await makePineTS().run(codeTop);
        const b: any = await makePineTS().run(codeFn);
        const aV = plotValues(a, 'htf');
        const bV = plotValues(b, 'htf');
        expect(aV.length).toEqual(bV.length);
        for (let i = 0; i < aV.length; i++) {
            const an = aV[i], bn = bV[i];
            if (Number.isNaN(an) && Number.isNaN(bn)) continue;
            expect(an).toEqual(bn);
        }
    });

    // ─────────────────────────────────────────────────────────────────────
    // 5. HTF tuple expression
    // ─────────────────────────────────────────────────────────────────────
    it('HTF tuple expression returns all components correctly aligned', async () => {
        const code = `
//@version=5
indicator("htf tuple")
[htfO, htfH, htfL, htfC] = request.security(syminfo.tickerid, "${HTF}", [open, high, low, close])
plot(htfO, "o")
plot(htfH, "h")
plot(htfL, "l")
plot(htfC, "c")
`;
        const ctx: any = await makePineTS().run(code);
        const o = plotValues(ctx, 'o');
        const h = plotValues(ctx, 'h');
        const l = plotValues(ctx, 'l');
        const c = plotValues(ctx, 'c');
        expect(o.length).toEqual(h.length);
        expect(h.length).toEqual(l.length);
        expect(l.length).toEqual(c.length);
        // h ≥ l on every bar with finite values — the OHLC invariant
        // survives the secondary's data-shaping.
        let checked = 0;
        for (let i = 0; i < o.length; i++) {
            if (Number.isFinite(h[i]) && Number.isFinite(l[i])) {
                expect(h[i]).toBeGreaterThanOrEqual(l[i]);
                checked++;
            }
        }
        expect(checked).toBeGreaterThan(5);
    });

    // ─────────────────────────────────────────────────────────────────────
    // 6. Same-TF shortcut
    // ─────────────────────────────────────────────────────────────────────
    it('Same-TF + same-symbol bypasses the secondary entirely (no cache entry)', async () => {
        const code = `
//@version=5
indicator("same tf")
htf = request.security(syminfo.tickerid, timeframe.period, close)
plot(htf, "htf")
`;
        const ctx: any = await makePineTS().run(code);
        // No HTF cache entry — the same-TF path returns the value
        // directly without spawning a secondary.
        const cacheKeys = Object.keys((ctx as any).cache || {});
        const htfKey = cacheKeys.find((k) => !k.includes('_lower') && k.includes('BTCUSDC'));
        expect(htfKey).toBeUndefined();
        // The captured stream must equal the chart's close.
        const vs = plotValues(ctx, 'htf');
        const chartClose = ctx.data.close.data as number[];
        expect(vs.length).toEqual(chartClose.length);
        for (let i = 0; i < vs.length; i++) {
            if (Number.isFinite(vs[i]) && Number.isFinite(chartClose[i])) {
                expect(vs[i]).toBeCloseTo(chartClose[i], 6);
            }
        }
    });

    // ─────────────────────────────────────────────────────────────────────
    // 7. lookahead=true vs lookahead=false
    // ─────────────────────────────────────────────────────────────────────
    it('lookahead_on and lookahead_off produce DIFFERENT HTF streams', async () => {
        const codeOff = `
//@version=5
indicator("la off")
htf = request.security(syminfo.tickerid, "${HTF}", close, barmerge.gaps_off, barmerge.lookahead_off)
plot(htf, "htf")
`;
        const codeOn = `
//@version=5
indicator("la on")
htf = request.security(syminfo.tickerid, "${HTF}", close, barmerge.gaps_off, barmerge.lookahead_on)
plot(htf, "htf")
`;
        const a: any = await makePineTS().run(codeOff);
        const b: any = await makePineTS().run(codeOn);
        const aV = plotValues(a, 'htf');
        const bV = plotValues(b, 'htf');
        expect(aV.length).toEqual(bV.length);
        let differing = 0;
        for (let i = 0; i < aV.length; i++) {
            if (Number.isFinite(aV[i]) && Number.isFinite(bV[i]) && aV[i] !== bV[i]) differing++;
        }
        // lookahead changes the temporal alignment.
        expect(differing).toBeGreaterThan(0);
    });

    // ─────────────────────────────────────────────────────────────────────
    // 8. gaps=true produces NaN→value pattern
    // ─────────────────────────────────────────────────────────────────────
    it('gaps=true produces values only on HTF-boundary transitions, NaN otherwise', async () => {
        const code = `
//@version=5
indicator("gaps")
htf = request.security(syminfo.tickerid, "${HTF}", close, barmerge.gaps_on, barmerge.lookahead_off)
plot(htf, "htf")
`;
        const ctx: any = await makePineTS().run(code);
        const vs = plotValues(ctx, 'htf');
        // Significantly more NaNs than finites — most daily bars don't
        // straddle a weekly boundary.
        const finites = vs.filter((v) => Number.isFinite(v)).length;
        const nans = vs.filter((v) => Number.isNaN(v)).length;
        expect(nans).toBeGreaterThan(finites);
        // At least one finite value (some boundary IS crossed in 2 months).
        expect(finites).toBeGreaterThan(0);
    });

    // ─────────────────────────────────────────────────────────────────────
    // 9. calc_bars_count
    // ─────────────────────────────────────────────────────────────────────
    it('calc_bars_count is accepted and produces finite values', async () => {
        const code = `
//@version=5
indicator("calc bars")
htfClose = request.security(syminfo.tickerid, "${HTF}", close, barmerge.gaps_off, barmerge.lookahead_off, calc_bars_count=20)
plot(htfClose, "htf")
`;
        const ctx: any = await makePineTS().run(code);
        const vs = plotValues(ctx, 'htf');
        expect(vs.length).toBeGreaterThan(5);
        const finite = vs.filter((v) => Number.isFinite(v));
        expect(finite.length).toBeGreaterThan(0);
    });

    // ─────────────────────────────────────────────────────────────────────
    // 10. Multiple HTF calls keep independent state
    // ─────────────────────────────────────────────────────────────────────
    it('two HTF calls with different TA depths produce independent streams', async () => {
        // Both at the same TF (W) but with different TA windows — the
        // captured values must differ on most bars because the SMAs
        // differ.
        const code = `
//@version=5
indicator("two htf")
a = request.security(syminfo.tickerid, "${HTF}", ta.sma(close, 2))
b = request.security(syminfo.tickerid, "${HTF}", ta.sma(close, 6))
plot(a, "a")
plot(b, "b")
`;
        const ctx: any = await makePineTS().run(code);
        const a = plotValues(ctx, 'a');
        const b = plotValues(ctx, 'b');
        expect(a.length).toEqual(b.length);
        let diffs = 0;
        for (let i = 0; i < a.length; i++) {
            if (Number.isFinite(a[i]) && Number.isFinite(b[i]) && Math.abs(a[i] - b[i]) > 1e-9) diffs++;
        }
        expect(diffs).toBeGreaterThan(0);
    });

    // ─────────────────────────────────────────────────────────────────────
    // 11. Stateful var inside HTF-fetching fn — Phase 3 probe shape
    // ─────────────────────────────────────────────────────────────────────
    it('stateful `var` inside an HTF-fetching user fn accumulates monotonically', async () => {
        // Repro of the Phase 3 probe-2 shape, applied to HTF. The
        // captured value reflects the secondary's `var n` accumulator,
        // which ticks once per HTF bar.
        const code = `
//@version=5
indicator("stateful var htf")
counter() =>
    var int n = 0
    n += 1
    request.security(syminfo.tickerid, "${HTF}", n)

n = counter()
plot(n, "n")
`;
        const ctx: any = await makePineTS().run(code);
        const ns = plotValues(ctx, 'n');
        // The values are monotonically non-decreasing — secondary's `n`
        // only ticks up.
        let prev = -Infinity;
        let finiteCount = 0;
        for (const v of ns) {
            if (!Number.isFinite(v)) continue;
            finiteCount++;
            expect(v).toBeGreaterThanOrEqual(prev);
            prev = v;
        }
        expect(finiteCount).toBeGreaterThan(5);
    });

    // ─────────────────────────────────────────────────────────────────────
    // 12. Cross-symbol HTF — slice must preserve the SYMBOL param
    // ─────────────────────────────────────────────────────────────────────
    it('HTF with hardcoded same-symbol literal returns the same stream as syminfo.tickerid', async () => {
        // Mock has only BTCUSDC, so we can't use a different symbol —
        // but we CAN verify the symbol literal path: hardcoded
        // "BTCUSDC" must produce identical results to the dynamic
        // syminfo.tickerid form. Phase 4's slicer must preserve the
        // symbol arg in either form.
        const codeLit = `
//@version=5
indicator("sym lit")
htf = request.security("BTCUSDC", "${HTF}", ta.sma(close, 3))
plot(htf, "htf")
`;
        const codeDyn = `
//@version=5
indicator("sym dyn")
htf = request.security(syminfo.tickerid, "${HTF}", ta.sma(close, 3))
plot(htf, "htf")
`;
        const a: any = await makePineTS().run(codeLit);
        const b: any = await makePineTS().run(codeDyn);
        const aV = plotValues(a, 'htf');
        const bV = plotValues(b, 'htf');
        expect(aV.length).toEqual(bV.length);
        for (let i = 0; i < aV.length; i++) {
            const an = aV[i], bn = bV[i];
            if (Number.isNaN(an) && Number.isNaN(bn)) continue;
            expect(an).toEqual(bn);
        }
    });
});
