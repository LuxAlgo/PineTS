import { describe, expect, it } from 'vitest';
import { PineTS } from '../../src/PineTS.class';

/**
 * Characterization tests for the Pine history-reference operator `[]` applied
 * to a CALL RESULT, e.g. `ta.sma(close, 3)[1]`.
 *
 * Pine semantics: `EXPR[N]` is ALWAYS the history operator (value N bars ago).
 * It works today on in-scope identifiers (`close[1]`, `smaVar[1]`) but is
 * dropped on a call result: the transpiler folds the `[N]` into `$.init`'s
 * `lookbehind` arg, which `Context.init` ignores for the scalar a `ta.*` call
 * returns — so `x = ta.sma(close,3)[1]` collapses to the CURRENT bar's value.
 *
 * The "history-on-call result" block asserts the CORRECT behaviour, so those
 * tests are RED before the fix and must turn GREEN after it.
 * The "regression guards" block captures forms that work TODAY and must STAY
 * green after the fix (identifier/var history, history-in-arg, and the genuine
 * tuple-destructure path that the fix must not mistake for a history ref).
 *
 * Run: npx vitest run tests/transpiler/history-on-call.test.ts
 */

// --- deterministic data (no network); varied OHLC so ta.* changes every bar ---
function makeBars(n: number) {
    const DAY = 86_400_000;
    const t0 = Date.UTC(2020, 0, 1);
    const bars = [];
    for (let i = 0; i < n; i++) {
        const base = 100 + 10 * Math.sin(i / 2) + i * 0.7;
        const close = base + Math.cos(i / 3) * 3;
        const open = base;
        const high = Math.max(open, close) + 2 + (i % 3);
        const low = Math.min(open, close) - 2 - (i % 2);
        bars.push({ openTime: t0 + i * DAY, open, high, low, close, volume: 1000 + i });
    }
    return bars;
}

// strip common leading indentation but keep relative indentation (Pine blocks)
function dedent(s: string): string {
    const lines = s.replace(/^\n/, '').replace(/\n\s*$/, '').split('\n');
    const widths = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length);
    const indent = Math.min(...widths);
    return lines.map((l) => l.slice(indent)).join('\n');
}

async function runPine(src: string) {
    const pine = new PineTS(makeBars(30), 'TEST', 'D');
    return pine.run(dedent(src));
}

function series(ctx: any, title: string): number[] {
    return (ctx.plots[title]?.data ?? []).map((d: any) => (d == null ? NaN : d.value));
}

// assert `actual` matches `expected` element-wise where expected is finite
function expectSeriesClose(actual: number[], expected: number[], fromIdx = 5) {
    let compared = 0;
    for (let i = fromIdx; i < expected.length; i++) {
        const e = expected[i];
        if (e == null || Number.isNaN(e)) continue;
        expect(actual[i]).toBeCloseTo(e, 6);
        compared++;
    }
    expect(compared).toBeGreaterThan(3); // ensure the window actually overlapped
}

// Build a script that plots ref = ta.sma(close,3), its correct previous
// (refPrev, via WORKING var-history), and the form under test (`u`).
function withRef(calc: string) {
    return `
        //@version=6
        indicator("t")
        ref = ta.sma(close, 3)
        refPrev = ref[1]
        ${calc}
        plot(ref, "ref")
        plot(refPrev, "refPrev")
        plot(u, "u")
    `;
}

describe('history operator on a CALL result (BUG — must pass after fix)', () => {
    it('global whole-init: u = ta.sma(close, 3)[1]', async () => {
        const ctx = await runPine(withRef(`u = ta.sma(close, 3)[1]`));
        expectSeriesClose(series(ctx, 'u'), series(ctx, 'refPrev'));
    });

    it('reassignment: u := ta.sma(close, 3)[1]', async () => {
        const src = `
            //@version=6
            indicator("t")
            ref = ta.sma(close, 3)
            refPrev = ref[1]
            u = 0.0
            u := ta.sma(close, 3)[1]
            plot(refPrev, "refPrev")
            plot(u, "u")
        `;
        const ctx = await runPine(src);
        expectSeriesClose(series(ctx, 'u'), series(ctx, 'refPrev'));
    });

    it('in-expression: u = ta.sma(close, 3)[1] + 0.0', async () => {
        const ctx = await runPine(withRef(`u = ta.sma(close, 3)[1] + 0.0`));
        expectSeriesClose(series(ctx, 'u'), series(ctx, 'refPrev'));
    });

    it('function local var: h = ta.sma(close, 3)[1] inside f()', async () => {
        const src = `
            //@version=6
            indicator("t")
            ref = ta.sma(close, 3)
            refPrev = ref[1]
            f() =>
                h = ta.sma(close, 3)[1]
                h
            u = f()
            plot(refPrev, "refPrev")
            plot(u, "u")
        `;
        const ctx = await runPine(src);
        expectSeriesClose(series(ctx, 'u'), series(ctx, 'refPrev'));
    });

    it('function direct return: g() => ta.sma(close, 3)[1]', async () => {
        const src = `
            //@version=6
            indicator("t")
            ref = ta.sma(close, 3)
            refPrev = ref[1]
            g() =>
                ta.sma(close, 3)[1]
            u = g()
            plot(refPrev, "refPrev")
            plot(u, "u")
        `;
        const ctx = await runPine(src);
        expectSeriesClose(series(ctx, 'u'), series(ctx, 'refPrev'));
    });

    it('lookback depth N=2: u = ta.sma(close, 3)[2]', async () => {
        const src = `
            //@version=6
            indicator("t")
            ref = ta.sma(close, 3)
            refPrev2 = ref[2]
            u = ta.sma(close, 3)[2]
            plot(refPrev2, "refPrev2")
            plot(u, "u")
        `;
        const ctx = await runPine(src);
        expectSeriesClose(series(ctx, 'u'), series(ctx, 'refPrev2'), 6);
    });
});

describe('history regression guards (must STAY green before and after fix)', () => {
    it('identifier history: y = close[1] equals the previous close', async () => {
        const src = `
            //@version=6
            indicator("t")
            y = close[1]
            plot(close, "cur")
            plot(y, "y")
        `;
        const ctx = await runPine(src);
        const cur = series(ctx, 'cur');
        const y = series(ctx, 'y');
        let compared = 0;
        for (let i = 1; i < cur.length; i++) {
            if (Number.isNaN(cur[i - 1])) continue;
            expect(y[i]).toBeCloseTo(cur[i - 1], 6);
            compared++;
        }
        expect(compared).toBeGreaterThan(5);
    });

    it('var history: w = smaVar[1] equals the previous SMA', async () => {
        const src = `
            //@version=6
            indicator("t")
            ref = ta.sma(close, 3)
            refPrev = ref[1]
            v = ta.sma(close, 3)
            w = v[1]
            plot(refPrev, "refPrev")
            plot(w, "w")
        `;
        const ctx = await runPine(src);
        expectSeriesClose(series(ctx, 'w'), series(ctx, 'refPrev'));
    });

    it('history in argument: ta.sma(close[1], 3) equals lagged SMA (the workaround)', async () => {
        const src = `
            //@version=6
            indicator("t")
            ref = ta.sma(close, 3)
            refPrev = ref[1]
            a = ta.sma(close[1], 3)
            plot(refPrev, "refPrev")
            plot(a, "a")
        `;
        const ctx = await runPine(src);
        expectSeriesClose(series(ctx, 'a'), series(ctx, 'refPrev'));
    });

    it('tuple destructure: [aa, bb] = f() returns the right elements (NOT a history ref)', async () => {
        const src = `
            //@version=6
            indicator("t")
            f2() =>
                [ta.sma(close, 3), ta.sma(close, 5)]
            [aa, bb] = f2()
            s3 = ta.sma(close, 3)
            s5 = ta.sma(close, 5)
            plot(aa, "aa")
            plot(bb, "bb")
            plot(s3, "s3")
            plot(s5, "s5")
        `;
        const ctx = await runPine(src);
        expectSeriesClose(series(ctx, 'aa'), series(ctx, 's3'));
        expectSeriesClose(series(ctx, 'bb'), series(ctx, 's5'), 7);
    });
});
