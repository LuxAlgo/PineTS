import { describe, expect, it } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';

/**
 * `na` propagation through comparison operators, validated against TradingView.
 *
 * Pine Script: any comparison with an `na` operand evaluates to `na` (NOT
 * boolean `false`) — for `==`, `!=`, and the relational operators `<`, `<=`,
 * `>`, `>=`. This is only observable via `na()`/`nz()`/arithmetic on the
 * result; branch/ternary outcomes are unchanged because `na` is falsy.
 *
 * TradingView ground truth (probed 2026-06-19, BTCUSDC 1W, `var float x = na`):
 *   na(x==x)=na(x!=x)=na(x==5)=na(x<1)=na(x>1)=na(x<=1)=na(x>=1) = true
 *   (x==x)?1:0 = 0   (branch unaffected)
 *   1.0+5e-10 == 1.0 -> false   (TV tolerance ~1e-10, tighter than PineTS's old 1e-9)
 *   1.0+5e-11 == 1.0 -> true
 *   1.0+5e-11 >  1.0 -> false   (relational applies the same ~1e-10 tolerance)
 *
 * These run through the full Pine-source transpiler path (so the `==`/`!=`/
 * relational operator rewrites are exercised). Booleans are encoded as
 * `cond ? 1 : 0` so plot values are unambiguous numbers.
 *
 * Run: npx vitest run tests/namespaces/math/na-comparison.test.ts
 */

function makeBars(n: number) {
    const DAY = 86_400_000;
    const t0 = Date.UTC(2020, 0, 1);
    const bars = [];
    for (let i = 0; i < n; i++) {
        const base = 100 + 10 * Math.sin(i / 2) + i * 0.7;
        const close = base + Math.cos(i / 3) * 3;
        const open = base;
        bars.push({ openTime: t0 + i * DAY, open, high: Math.max(open, close) + 1, low: Math.min(open, close) - 1, close, volume: 1000 + i });
    }
    return bars;
}

function dedent(s: string): string {
    const lines = s.replace(/^\n/, '').replace(/\n\s*$/, '').split('\n');
    const widths = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length);
    const indent = Math.min(...widths);
    return lines.map((l) => l.slice(indent)).join('\n');
}

async function runPine(src: string) {
    const pine = new PineTS(makeBars(20), 'TEST', 'D');
    return pine.run(dedent(src));
}

// last finite plotted value for a title
function val(ctx: any, title: string): number {
    const data = ctx.plots[title]?.data ?? [];
    for (let i = data.length - 1; i >= 0; i--) {
        const v = data[i]?.value;
        if (v != null && !Number.isNaN(v)) return v;
    }
    return NaN;
}

describe('na propagation — == / != (must pass after fix)', () => {
    it('na operands make ==/!= evaluate to na (na() detects it)', async () => {
        const ctx = await runPine(`
            //@version=6
            indicator("t")
            var float x = na
            plot(na(x == x) ? 1 : 0, "eqeq")
            plot(na(x != x) ? 1 : 0, "nene")
            plot(na(x == 5) ? 1 : 0, "eq5")
            plot(na(x != 5) ? 1 : 0, "ne5")
        `);
        expect(val(ctx, 'eqeq')).toBe(1);
        expect(val(ctx, 'nene')).toBe(1);
        expect(val(ctx, 'eq5')).toBe(1);
        expect(val(ctx, 'ne5')).toBe(1);
    });

    it('assigning a na comparison to a bool var does not coerce it to false', async () => {
        const ctx = await runPine(`
            //@version=6
            indicator("t")
            var float x = na
            b = x == x
            plot(na(b) ? 1 : 0, "nab")
        `);
        expect(val(ctx, 'nab')).toBe(1);
    });
});

describe('na propagation — relational < <= > >= (must pass after fix)', () => {
    it('na operands make relational operators evaluate to na', async () => {
        const ctx = await runPine(`
            //@version=6
            indicator("t")
            var float x = na
            plot(na(x < 1) ? 1 : 0, "lt")
            plot(na(x > 1) ? 1 : 0, "gt")
            plot(na(x <= 1) ? 1 : 0, "le")
            plot(na(x >= 1) ? 1 : 0, "ge")
        `);
        expect(val(ctx, 'lt')).toBe(1);
        expect(val(ctx, 'gt')).toBe(1);
        expect(val(ctx, 'le')).toBe(1);
        expect(val(ctx, 'ge')).toBe(1);
    });
});

describe('epsilon tolerance tightened to 1e-10 (must pass after fix)', () => {
    it('== uses ~1e-10 tolerance (5e-10 differs, 5e-11 equal)', async () => {
        const ctx = await runPine(`
            //@version=6
            indicator("t")
            plot((1.0 + 5e-10 == 1.0) ? 1 : 0, "outside")
            plot((1.0 + 5e-11 == 1.0) ? 1 : 0, "inside")
        `);
        expect(val(ctx, 'outside')).toBe(0); // 5e-10 > 1e-10 -> not equal (TV)
        expect(val(ctx, 'inside')).toBe(1);  // 5e-11 < 1e-10 -> equal (TV)
    });

    it('relational applies the same ~1e-10 tolerance', async () => {
        const ctx = await runPine(`
            //@version=6
            indicator("t")
            plot((1.0 + 5e-11 > 1.0) ? 1 : 0, "gt_within")
            plot((1.0 <= 1.0 + 5e-11) ? 1 : 0, "le_within")
            plot((1.0 + 5e-10 > 1.0) ? 1 : 0, "gt_outside")
        `);
        expect(val(ctx, 'gt_within')).toBe(0);  // within tol -> not greater
        expect(val(ctx, 'le_within')).toBe(1);  // within tol -> <= true
        expect(val(ctx, 'gt_outside')).toBe(1); // outside tol -> greater
    });
});

describe('regression guards — branch outcomes and non-na correctness (green before AND after)', () => {
    it('branch/ternary on na comparisons still take the false branch', async () => {
        const ctx = await runPine(`
            //@version=6
            indicator("t")
            var float x = na
            plot((x == x) ? 1 : 0, "br_eq")
            plot((x != x) ? 1 : 0, "br_ne")
            plot((x < 1) ? 1 : 0, "br_lt")
            plot((x >= 1) ? 1 : 0, "br_ge")
        `);
        expect(val(ctx, 'br_eq')).toBe(0);
        expect(val(ctx, 'br_ne')).toBe(0);
        expect(val(ctx, 'br_lt')).toBe(0);
        expect(val(ctx, 'br_ge')).toBe(0);
    });

    it('non-na comparisons keep correct boolean results', async () => {
        const ctx = await runPine(`
            //@version=6
            indicator("t")
            plot((close == close) ? 1 : 0, "self_eq")
            plot((close != close) ? 1 : 0, "self_ne")
            plot((2.0 == 2.0) ? 1 : 0, "eq_t")
            plot((2.0 == 3.0) ? 1 : 0, "eq_f")
            plot((2.0 > 1.0) ? 1 : 0, "gt_t")
            plot((1.0 > 2.0) ? 1 : 0, "gt_f")
            plot((1.0 <= 2.0) ? 1 : 0, "le_t")
            plot((close >= close[1]) ? 1 : 0, "rel_series")
        `);
        expect(val(ctx, 'self_eq')).toBe(1);
        expect(val(ctx, 'self_ne')).toBe(0);
        expect(val(ctx, 'eq_t')).toBe(1);
        expect(val(ctx, 'eq_f')).toBe(0);
        expect(val(ctx, 'gt_t')).toBe(1);
        expect(val(ctx, 'gt_f')).toBe(0);
        expect(val(ctx, 'le_t')).toBe(1);
        // rel_series is 0 or 1 depending on data, just ensure it is a clean bool (not na)
        expect([0, 1]).toContain(val(ctx, 'rel_series'));
    });
});
