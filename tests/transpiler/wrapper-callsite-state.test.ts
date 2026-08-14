// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Wrapper-callsite-state regression tests
 *
 * Pine semantics is per-call-PATH. PineTS used to key user-function `var`/`let`
 * slots and `ta.*` accumulator state by the immediate (top-of-stack) callsite
 * id only. When a stateful function was reached via two different paths
 * through a common parametrised wrapper, both invocations resolved to the
 * SAME runtime slot and clobbered each other every bar.
 *
 * The fix replaces `peekId()` with the cumulative path of the call stack
 * (joined ids), so each unique call path gets its own lctx entry. The
 * transpiler is unchanged — both `$$.var.*` slots and `$$.id + '_taN'`
 * ta callsite ids inherit the new key shape automatically.
 *
 * Discovered while reproducing Smart-Money-Concepts-LuxAlgo's mismatched
 * internal-OB count (4 vs 5 on BTCUSDC weekly).
 */

import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

const makePineTS = () =>
    new PineTS(
        Provider.Mock,
        'BTCUSDC',
        'D',
        null,
        new Date('2019-01-01').getTime(),
        new Date('2019-02-15').getTime(),
    );

/**
 * Read the value of plot `title` on the last produced bar.
 * Using `plot(value, "title")` in the script and reading from
 * `plots[title].data[lastIndex].value` is the simplest way to expose
 * bar-level scalar values to the JS test harness.
 */
function lastPlotValue(plots: any, title: string): number {
    const data = plots?.[title]?.data;
    expect(data, `plot ${title} should exist`).toBeDefined();
    expect(data.length, `plot ${title} should have at least 1 bar`).toBeGreaterThan(0);
    return data[data.length - 1].value;
}

describe('Wrapper-callsite var/let/ta state isolation', () => {
    // ─────────────────────────────────────────────────────────────────────
    // 1. Bug repro — a stateful inner fn called from one syntactic site
    //    inside a wrapper, the wrapper itself called from two distinct
    //    global call sites. State must NOT bleed between call paths.
    // ─────────────────────────────────────────────────────────────────────
    it('isolates `var` state when a stateful inner fn is reached via two paths through one wrapper', async () => {
        const code = `
//@version=5
indicator("wrapper var-state isolation")

counter() =>
    var int n = 0
    n += 1
    n

w() => counter()

a = w()
b = w()

plot(a, "a")
plot(b, "b")
`;
        const { plots } = await makePineTS().run(code);
        const a = lastPlotValue(plots, 'a');
        const b = lastPlotValue(plots, 'b');

        // Pine semantics: each call path has its own counter — both paths
        // see the SAME final count (one increment per bar in their own slot).
        // Pre-fix, the shared counter is incremented twice per bar so
        // `a` is one less than `b` on every bar (a = 2k+1, b = 2k+2).
        expect(a).toEqual(b);
    });

    // ─────────────────────────────────────────────────────────────────────
    // 2. Single-path wrapper preservation: state must persist across bars
    //    when the wrapper has only one global call path.
    // ─────────────────────────────────────────────────────────────────────
    it('preserves cross-bar state for a wrapper called from one global site', async () => {
        const code = `
//@version=5
indicator("single-path wrapper state")

counter() =>
    var int n = 0
    n += 1
    n

w() => counter()

x = w()

plot(x, "x")
`;
        const { plots } = await makePineTS().run(code);
        const data = plots['x']?.data ?? [];
        // Counter should equal bar number (1-indexed) on every bar.
        expect(data.length).toBeGreaterThan(5);
        for (let i = 0; i < data.length; i++) {
            expect(data[i].value).toEqual(i + 1);
        }
    });

    // ─────────────────────────────────────────────────────────────────────
    // 3. Two distinct global call sites, no wrapper. The fix must not
    //    regress the case that already worked — each syntactic site keeps
    //    its own state.
    // ─────────────────────────────────────────────────────────────────────
    it('keeps state independent for two distinct global call sites of the same fn', async () => {
        const code = `
//@version=5
indicator("two global call sites")

counter() =>
    var int n = 0
    n += 1
    n

a = counter()
b = counter()

plot(a, "a")
plot(b, "b")
`;
        const { plots } = await makePineTS().run(code);
        const a = lastPlotValue(plots, 'a');
        const b = lastPlotValue(plots, 'b');

        // Distinct syntactic sites → distinct state → both equal final bar.
        expect(a).toEqual(b);
        // And each must equal the total bar count (one increment per bar
        // per site), not 2× the bar count (which would indicate they
        // share state and increment twice per bar).
        const dataLen = plots['a'].data.length;
        expect(a).toEqual(dataLen);
    });

    // ─────────────────────────────────────────────────────────────────────
    // 4. Wrapper called inside a `for` loop with the same arg —
    //    iterations of the same syntactic call share state (correct Pine
    //    semantics: the path doesn't depend on argument values, only on
    //    syntactic ids).
    // ─────────────────────────────────────────────────────────────────────
    it('shares state across loop iterations of the same syntactic wrapper call', async () => {
        const code = `
//@version=5
indicator("loop-iteration shared state")

counter() =>
    var int n = 0
    n += 1
    n

w() => counter()

var int last = 0
for i = 0 to 4
    last := w()

plot(last, "last")
`;
        const { plots } = await makePineTS().run(code);
        const data = plots['last']?.data ?? [];
        expect(data.length).toBeGreaterThan(5);
        // 5 increments per bar via one syntactic call site → same path on
        // each iteration → final count = 5 × bar-number.
        for (let i = 0; i < data.length; i++) {
            expect(data[i].value).toEqual(5 * (i + 1));
        }
    });

    // ─────────────────────────────────────────────────────────────────────
    // 5. Three-deep nesting — outer → mid → inner where outer is called
    //    from two distinct global call sites. The deepest stateful
    //    function must split state along both paths.
    // ─────────────────────────────────────────────────────────────────────
    it('splits state at depth 3 when the outermost wrapper has two distinct call sites', async () => {
        const code = `
//@version=5
indicator("depth-3 path split")

counter() =>
    var int n = 0
    n += 1
    n

inner() => counter()
mid()   => inner()
outer() => mid()

a = outer()
b = outer()

plot(a, "a")
plot(b, "b")
`;
        const { plots } = await makePineTS().run(code);
        const a = lastPlotValue(plots, 'a');
        const b = lastPlotValue(plots, 'b');
        expect(a).toEqual(b);
        // Each path increments its own counter once per bar → equals the
        // bar count, not 2× the bar count (which would indicate path
        // collapse below depth 1).
        const barCount = plots['a'].data.length;
        expect(a).toEqual(barCount);
    });

    // ─────────────────────────────────────────────────────────────────────
    // 6. Multiple sibling stateful call sites inside one wrapper, with the
    //    wrapper itself reached via two distinct paths. Both inner sites
    //    must independently split state across paths — i.e. the path key
    //    composes uniformly across every nested syntactic site, not just
    //    the first one.
    //
    // (UDT method dispatch through a wrapper parameter is an intentional
    // gap left for now: `obj.method()` where `obj` is a function param
    // currently transpiles to `$.get(obj, 0)?.method?.()` and bypasses
    // `$.call(...)` entirely. That short-circuit is a separate pre-existing
    // limitation; for path-keyed state we exercise the equivalent shape
    // via plain-function nesting.)
    // ─────────────────────────────────────────────────────────────────────
    it('splits state at every sibling callsite inside a wrapper across two paths', async () => {
        const code = `
//@version=5
indicator("sibling callsites path split")

counter() =>
    var int n = 0
    n += 1
    n

w() =>
    p = counter()
    q = counter()
    p + q

a = w()
b = w()

plot(a, "a")
plot(b, "b")
`;
        const { plots } = await makePineTS().run(code);
        const a = lastPlotValue(plots, 'a');
        const b = lastPlotValue(plots, 'b');

        // Post-fix, each path has its own pair of counters (one per
        // syntactic call site), each incremented exactly once per bar →
        // a == b == 2 × barCount.
        // Pre-fix, the two paths share BOTH inner slots, so each counter
        // increments twice per bar; a = 4k+2 and b = 4k+4 diverge.
        const barCount = plots['a'].data.length;
        expect(a).toEqual(b);
        expect(a).toEqual(2 * barCount);
    });

    // ─────────────────────────────────────────────────────────────────────
    // 7. `ta.*` accumulator state — the secondary leak: ta callsite ids
    //    are emitted as `$$.id + '_taN'`. Once `$$.id` is path-keyed, the
    //    ta state key automatically follows. Verify with `ta.barssince`,
    //    which is unambiguously path-dependent: pre-fix, two paths feeding
    //    different conditions into one syntactic ta.barssince() call
    //    share `state.prevLastTrueIndex` and produce wrong counts.
    // ─────────────────────────────────────────────────────────────────────
    it('isolates `ta.*` state across paths through a wrapper (ta.barssince)', async () => {
        const code = `
//@version=5
indicator("ta path isolation")

inner(bool cond) => ta.barssince(cond)
w(bool cond)     => inner(cond)

// Path A fires every 5 bars, path B fires every 3 bars.
bs5 = w(bar_index % 5 == 0)
bs3 = w(bar_index % 3 == 0)

plot(bs5, "bs5")
plot(bs3, "bs3")
plot(bar_index, "bidx")
`;
        const { plots } = await makePineTS().run(code);
        const bs5Data = plots['bs5'].data;
        const bs3Data = plots['bs3'].data;
        const bidxData = plots['bidx'].data;
        expect(bs5Data.length).toEqual(bs3Data.length);
        expect(bs5Data.length).toBeGreaterThan(15);

        // Ground-truth values per path (independent ta state).
        // bs5 = bar_index - (bar_index - bar_index % 5) = bar_index % 5
        // bs3 = bar_index % 3
        // Pre-fix, these collapse to a single sequence governed by the
        // most-recent firing of EITHER condition — bs5 ends up tracking
        // bs3's state on bars where bar_index % 3 == 0 but
        // bar_index % 5 != 0 (e.g. bidx 3, 6, 9, 12, …).
        let mismatches = 0;
        for (let i = 0; i < bs5Data.length; i++) {
            const bidx = bidxData[i].value;
            const expected5 = bidx % 5;
            const expected3 = bidx % 3;
            if (bs5Data[i].value !== expected5) mismatches++;
            if (bs3Data[i].value !== expected3) mismatches++;
        }
        expect(mismatches).toEqual(0);

        // And confirm the two series actually differ (i.e. the test isn't
        // vacuously satisfied by both being zero).
        let differingBars = 0;
        for (let i = 0; i < bs5Data.length; i++) {
            if (bs5Data[i].value !== bs3Data[i].value) differingBars++;
        }
        expect(differingBars).toBeGreaterThan(5);
    });
});
