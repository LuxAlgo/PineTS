// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Regression: function-level `*.param(value, idx, 'pN')` calls used to
 * pass a STATIC `'pN'` string baked into the function body, and the
 * runtime stored the resulting series in `context.params[name]` — a
 * globally-keyed map. When the same function body was reached via two
 * distinct call paths in the same bar (one wrapper invoked twice with
 * different args), each path wrote a different value to the SAME
 * `params['pN']` slot — clobbering the other path's history.
 *
 * Concretely it broke `ta.crossover` / `ta.crossunder` inside a
 * function: those are stateless, but they read `s2.get(1)` from the
 * param series. With a clobbered `params['pN']`, the previous-bar
 * threshold reflected the OTHER call path's value — flipping the
 * crossover/crossunder result on the next bar.
 *
 * Symptom in Smart-Money-Concepts (LuxAlgo): `displayStructure(true)`
 * (internal) and `displayStructure()` (swing) are both called every
 * bar. Both write the same `params['p3']` for the bullish-branch
 * threshold. The second call clobbered the first, so the next bar's
 * `ta.crossover(close, p_ivot.currentLevel)` saw the wrong prev
 * threshold and either fired spuriously or missed real crossovers,
 * producing spurious / missing internal BOS lines.
 *
 * Fix: emit `$$.id + 'pN'` as the third arg when inside a function
 * scope, so the runtime keys params on the call-path id. Mirrors the
 * existing `$$.id + '_taN'` convention used for ta callsite ids.
 */

import { describe, it, expect } from 'vitest';
import { transpile } from '../../src/transpiler/index';
import { PineTS, Provider } from 'index';

const makePineTS = () =>
    new PineTS(Provider.Mock, 'BTCUSDC', 'D', null,
        new Date('2019-01-01').getTime(),
        new Date('2019-01-15').getTime());

describe('Param-history callsite isolation', () => {
    // ─────────────────────────────────────────────────────────────────────
    // Codegen shape
    // ─────────────────────────────────────────────────────────────────────
    it('inside a function body, *.param(value, idx, name) uses `$$.id + \'pN\'`', () => {
        const code = `
//@version=5
indicator("x")
f(float t) =>
    ta.crossover(close, t)
f(50.0)
`;
        const js = transpile(code).toString();
        // The threshold-tracking ta.param call lives inside f(), where $$
        // is the local context. The third arg should be the path-prefixed
        // form, not a bare literal.
        expect(js).toMatch(/ta\.param\([^)]*,\s*\$\$\.id\s*\+\s*'p\d+'\s*\)/);
    });

    it('at top level, *.param(value, idx, name) keeps a literal `\'pN\'`', () => {
        const code = `
//@version=5
indicator("x")
plot(close[1])
`;
        const js = transpile(code).toString();
        // Top-level `close[1]` becomes `plot.param(close, 1, 'pN')` —
        // must be the literal form (no `$$` at module scope).
        expect(js).toMatch(/plot\.param\(close,\s*1,\s*'p\d+'\)/);
        // The path-prefixed form should NOT appear at top level.
        expect(js).not.toMatch(/\.param\([^)]*,\s*\$\$\.id\s*\+/);
    });

    it('inside a function body, params nested inside if/for still get path-prefixed', () => {
        // The fix relies on `isInsideFunctionScope()` (any 'fn' on the
        // scope stack), not just the immediate scope type — params often
        // get emitted from within a nested if/for/while inside a fn body.
        const code = `
//@version=5
indicator("x")
f(float t) =>
    if close > t
        plot(close[1])
    t
f(50.0)
`;
        const js = transpile(code).toString();
        // close[1] inside the if inside f() must still be path-prefixed.
        expect(js).toMatch(/\.param\(close,\s*1,\s*\$\$\.id\s*\+\s*'p\d+'\)/);
    });

    // ─────────────────────────────────────────────────────────────────────
    // Runtime — the actual bite
    // ─────────────────────────────────────────────────────────────────────
    it('runtime: ta.crossunder via wrapper called from two paths does not leak history', async () => {
        // Direct repro of the SMC shape: a probe function uses
        // ta.crossunder with a passed-in threshold. Two call paths feed
        // the same body different thresholds. Source is a literal 50,
        // never moves — so neither crossunder should ever fire.
        // Pre-fix, the high-threshold path's prev-threshold is clobbered
        // every bar by the low-threshold call → false positive on bar 2+.
        const code = `
//@version=5
indicator("path-leak runtime")

probe(float threshold) =>
    ta.crossunder(50.0, threshold) ? 1 : 0

xa = probe(100.0)   // pre-fix: 1 from bar 2 onwards. post-fix: 0 always.
xb = probe(10.0)    // 0 always (own threshold, no clobber)

plot(xa, "xa")
plot(xb, "xb")
`;
        const { plots } = await makePineTS().run(code);
        const xa = plots['xa'].data;
        const xb = plots['xb'].data;
        expect(xa.length).toBeGreaterThan(5);
        // Neither should ever fire.
        for (let i = 0; i < xa.length; i++) {
            expect(xa[i].value, `xa@bar${i}`).toEqual(0);
            expect(xb[i].value, `xb@bar${i}`).toEqual(0);
        }
    });

    it('runtime: ta.crossover via wrapper called from two paths does not leak history', async () => {
        // Mirror test for the bullish branch. With sources kept BELOW
        // every threshold, no crossover should ever fire.
        const code = `
//@version=5
indicator("path-leak crossover")

probe(float threshold) =>
    ta.crossover(50.0, threshold) ? 1 : 0

xa = probe(10.0)    // pre-fix: 1 from bar 2 onwards. post-fix: 0 always.
xb = probe(100.0)   // 0 always

plot(xa, "xa")
plot(xb, "xb")
`;
        const { plots } = await makePineTS().run(code);
        const xa = plots['xa'].data;
        const xb = plots['xb'].data;
        for (let i = 0; i < xa.length; i++) {
            expect(xa[i].value, `xa@bar${i}`).toEqual(0);
            expect(xb[i].value, `xb@bar${i}`).toEqual(0);
        }
    });

    it('runtime: ta.barssince via wrapper called from two paths gets independent state', async () => {
        // ta.barssince keeps state via taState (not via params), but its
        // condition argument is wrapped with ta.param. With shared
        // params, the LAST condition written by either path overwrites
        // the other's previous-bar value — so subsequent reads see the
        // wrong history. Two different conditions through the same
        // wrapper exercise this clearly.
        const code = `
//@version=5
indicator("ta-via-wrapper-paths")

probe(bool cond) =>
    int n = ta.barssince(cond)
    n

// On bar k, x5 should be (k % 5) and x3 should be (k % 3) — they are
// independent counters. Pre-fix, the shared params slot for the
// condition argument made each path see whichever cond was written
// LAST in the previous bar, scrambling both counts.
x5 = probe(bar_index % 5 == 0)
x3 = probe(bar_index % 3 == 0)

plot(x5, "x5")
plot(x3, "x3")
plot(bar_index, "bidx")
`;
        const { plots } = await makePineTS().run(code);
        const x5 = plots['x5'].data;
        const x3 = plots['x3'].data;
        const bidx = plots['bidx'].data;
        expect(x5.length).toBeGreaterThan(8);
        let differing = 0;
        for (let i = 0; i < x5.length; i++) {
            const k = bidx[i].value;
            expect(x5[i].value, `x5@bar${i}`).toEqual(k % 5);
            expect(x3[i].value, `x3@bar${i}`).toEqual(k % 3);
            if (x5[i].value !== x3[i].value) differing++;
        }
        // Sanity: the two series MUST actually differ on multiple bars,
        // otherwise the test is vacuously satisfied.
        expect(differing).toBeGreaterThan(3);
    });
});
