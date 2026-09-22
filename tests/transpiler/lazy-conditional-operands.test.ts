// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Lazy evaluation of `?:` branches and `and` / `or` operands.
 *
 * Reference: TradingView's "To Pine Script version 6" migration guide, section
 * "Lazy evaluation of conditions":
 *
 *   - `?:` is lazy in EVERY Pine version: only the taken branch is evaluated.
 *     ("Pine v5 evaluates all bool expressions except for the `?:` ternary
 *     operator strictly".)
 *   - `and` / `or` are STRICT in v5 (both operands always evaluated) and LAZY
 *     in v6 (the right operand is skipped once the result is known).
 *   - Bare PineTS syntax is JavaScript, whose `&&` / `||` / `?:` are lazy.
 *
 * Historically the transpiler hoisted every namespace call inside these
 * operands into an unconditional `temp_N` const ahead of the statement, so a
 * guarded `array.get(a, 0)` ran even when `array.size(a) > 0` was false and
 * threw "Index 0 is out of bounds". Stateful `ta.*` calls in an untaken
 * branch were also executed on every bar, diverging from TradingView.
 *
 * Observable used for "was the branch executed on this bar?": `ta.cum(1)`
 * counts the bars on which it was actually called, so its value on a given
 * bar is a hand-derivable execution count.
 */
import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

function mk() {
    return new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());
}

const pine = (version: 5 | 6, body: string) => `//@version=${version}\nindicator("t")\n${body}`;

describe('?: is lazy (all versions)', () => {
    for (const v of [5, 6] as const) {
        it(`v${v}: guarded array.get in a ternary branch does not throw on an empty array`, async () => {
            const { plots } = await mk().run(
                pine(v, `var a = array.new_float()
x = array.size(a) > 0 ? array.get(a, 0) : na
plot(x, "x")`)
            );
            const x = plots['x'].data.map((p) => p.value);
            expect(x.length).toBeGreaterThan(0);
            expect(x.every((val) => Number.isNaN(val))).toBe(true);
        });

        it(`v${v}: the alternate branch is lazy too`, async () => {
            const { plots } = await mk().run(
                pine(v, `var a = array.new_float()
x = array.size(a) == 0 ? na : array.get(a, 0)
plot(x, "x")`)
            );
            expect(plots['x'].data.every((p) => Number.isNaN(p.value))).toBe(true);
        });

        it(`v${v}: ta.* inside a ternary branch only executes on bars where the branch is taken`, async () => {
            const { plots } = await mk().run(
                pine(v, `// even bars: count executions; odd bars: -1
x = bar_index % 2 == 0 ? ta.cum(1) : -1
plot(x, "x")`)
            );
            const x = plots['x'].data.map((p) => p.value);
            // Hand-derived under TV lazy semantics: on even bar 2k the branch has
            // run k+1 times so far (bars 0, 2, ..., 2k).
            expect(x[0]).toBe(1);
            expect(x[1]).toBe(-1);
            expect(x[2]).toBe(2);
            expect(x[3]).toBe(-1);
            expect(x[10]).toBe(6);
            expect(x[20]).toBe(11);
        });

        it(`v${v}: ternary inside a user function is lazy`, async () => {
            const { plots } = await mk().run(
                pine(v, `f(arr) => array.size(arr) > 0 ? array.get(arr, 0) : na
var a = array.new_float()
plot(f(a), "x")`)
            );
            expect(plots['x'].data.every((p) => Number.isNaN(p.value))).toBe(true);
        });

        it(`v${v}: ternary passed directly as a function argument is lazy`, async () => {
            const { plots } = await mk().run(
                pine(v, `var a = array.new_float()
plot(array.size(a) > 0 ? array.get(a, 0) : na, "x")`)
            );
            expect(plots['x'].data.every((p) => Number.isNaN(p.value))).toBe(true);
        });

        it(`v${v}: nested call inside the taken branch still works and gets its arguments`, async () => {
            const { plots } = await mk().run(
                pine(v, `var a = array.from(1.0, 2.0, 3.0)
x = array.size(a) > 0 ? math.max(array.get(a, 0), array.get(a, 2)) : na
plot(x, "x")`)
            );
            expect(plots['x'].data.every((p) => p.value === 3)).toBe(true);
        });

        it(`v${v}: built-in ta variable (ta.tr) inside a ternary branch works`, async () => {
            const { plots } = await mk().run(
                pine(v, `x = bar_index % 2 == 0 ? ta.tr : 0
plot(x, "x")
plot(ta.tr, "ref")`)
            );
            const x = plots['x'].data.map((p) => p.value);
            const ref = plots['ref'].data.map((p) => p.value);
            expect(x[2]).toBeCloseTo(ref[2], 8);
            expect(x[3]).toBe(0);
        });

        it(`v${v}: built-in ta variable as an argument of a call inside a ternary branch works`, async () => {
            const { plots } = await mk().run(
                pine(v, `x = bar_index % 2 == 0 ? math.max(ta.tr, 0) : 0
plot(x, "x")
plot(ta.tr, "ref")`)
            );
            const x = plots['x'].data.map((p) => p.value);
            const ref = plots['ref'].data.map((p) => p.value);
            expect(x[2]).toBeCloseTo(ref[2], 8);
            expect(x[3]).toBe(0);
        });
    }
});

describe('and / or: strict in v5, lazy in v6 (TradingView semantics)', () => {
    it('v6: `size > 0 and get(...)` guard does not throw on an empty array', async () => {
        const { plots } = await mk().run(
            pine(6, `var a = array.new_float()
y = array.size(a) > 0 and array.get(a, 0) > 0
plot(y ? 1 : 0, "y")`)
        );
        expect(plots['y'].data.every((p) => p.value === 0)).toBe(true);
    });

    it('v6: `size == 0 or get(...)` guard does not throw on an empty array', async () => {
        const { plots } = await mk().run(
            pine(6, `var a = array.new_float()
z = array.size(a) == 0 or array.get(a, 0) > 0
plot(z ? 1 : 0, "z")`)
        );
        expect(plots['z'].data.every((p) => p.value === 1)).toBe(true);
    });

    it('v6: ta.* on the right of `and` only runs when the left side is true', async () => {
        const { plots } = await mk().run(
            pine(6, `// cum executes only on even bars: its k-th execution happens on bar 2(k-1)
flag = bar_index % 2 == 0 and ta.cum(1) >= 50
plot(flag ? 1 : 0, "f")`)
        );
        const f = plots['f'].data.map((p) => p.value);
        // 50th execution is on bar 98 -> first true at bar 98, false before
        expect(f[50]).toBe(0);
        expect(f[96]).toBe(0);
        expect(f[98]).toBe(1);
    });

    it('v5: ta.* on the right of `and` runs on every bar (strict evaluation)', async () => {
        const { plots } = await mk().run(
            pine(5, `flag = bar_index % 2 == 0 and ta.cum(1) >= 50
plot(flag ? 1 : 0, "f")`)
        );
        const f = plots['f'].data.map((p) => p.value);
        // cum runs every bar: cum = bar_index + 1, so >= 50 from bar 49; first even bar is 50
        expect(f[48]).toBe(0);
        expect(f[50]).toBe(1);
        expect(f[51]).toBe(0);
        expect(f[52]).toBe(1);
    });

    it('v5: `and` guard is strict, so the guarded array.get still throws (as it does on TradingView v5)', async () => {
        await expect(
            mk().run(
                pine(5, `var a = array.new_float()
y = array.size(a) > 0 and array.get(a, 0) > 0
plot(y ? 1 : 0, "y")`)
            )
        ).rejects.toThrow(/out of bounds/);
    });
});

describe('v5 and / or nested inside a taken ?: branch stay strict', () => {
    // TradingView (verified with a side-effecting right operand on BINANCE:BTCUSDT
    // 60): in v5 the right operand of `and` / `or` runs on every bar where the
    // enclosing ternary branch is taken, even when the left operand already
    // decides the result. In v6 it is skipped. The branch itself is lazy in
    // both versions, so nothing runs on bars where the branch is not taken.
    //
    // Probe: push one element per bar, and let the right operand pop it. The
    // array size on bar i is therefore
    //   v5 (strict): pops on even bars -> size grows on odd bars only -> floor((i + 1) / 2)
    //   v6 (lazy):   never pops                                        -> i + 1
    const POP_AND = `var arr = array.new_int()
array.push(arr, 0)
z = bar_index % 2 == 0 ? (bar_index < 0 and array.pop(arr) == 0) : false
plot(array.size(arr), "n")`;
    const POP_OR = `var arr = array.new_int()
array.push(arr, 0)
z = bar_index % 2 == 0 ? (bar_index >= 0 or array.pop(arr) == 0) : false
plot(array.size(arr), "n")`;

    for (const [op, body] of [['and', POP_AND], ['or', POP_OR]] as const) {
        it(`v5: right operand of \`${op}\` inside a taken branch is evaluated (strict)`, async () => {
            const { plots } = await mk().run(pine(5, body));
            const n = plots['n'].data.map((p) => p.value);
            expect(n.slice(0, 6)).toEqual([0, 1, 1, 2, 2, 3]);
            expect(n[20]).toBe(10);
            expect(n[21]).toBe(11);
        });

        it(`v6: right operand of \`${op}\` inside a taken branch is short-circuited (lazy)`, async () => {
            const { plots } = await mk().run(pine(6, body));
            const n = plots['n'].data.map((p) => p.value);
            expect(n.slice(0, 6)).toEqual([1, 2, 3, 4, 5, 6]);
            expect(n[20]).toBe(21);
        });
    }

    it('v5: strict logical in a branch is lowered to math.__and / __or; v6 keeps native && / ||', async () => {
        const { transpile } = await import('../../src/transpiler');
        const src5 = transpile(pine(5, POP_AND)).toString();
        const src6 = transpile(pine(6, POP_AND)).toString();
        expect(src5).toMatch(/\$\.pine\.math\.__and\(/);
        expect(src6).not.toMatch(/__and\(/);
        // eager position (not inside a branch) keeps hoisting in both versions
        const eager5 = transpile(pine(5, 'y = bar_index < 0 and ta.cum(1) > 0\nplot(y ? 1 : 0, "y")')).toString();
        expect(eager5).not.toMatch(/__and\(/);
        expect(eager5).toMatch(/const temp_\d+ = ta\.cum\(/);
    });
});

describe('history-reading ta.* in the ternary TEST passed as a call argument (#304)', () => {
    // `plot(ta.crossover(f, s) ? 1 : 0)` used to be transpiled to a scalar call
    // `ta.crossover($.get(p5, 0), $.get(p6, 0))` because the conditional-argument
    // walker re-visited the hoisted call's (shared) argument nodes, so `[1]`
    // lookups inside the function saw NaN and it was always false. Reference:
    // the same predicate written out by hand with the history operator.
    const HEADER = `f = ta.ema(close, 3)
s = ta.ema(close, 8)
`;
    const cases: Array<[string, string, string]> = [
        ['ta.crossover', 'plot(ta.crossover(f, s) ? 1 : 0, "x")', 'plot(f > s and f[1] <= s[1] ? 1 : 0, "ref")'],
        ['ta.crossunder', 'plot(ta.crossunder(f, s) ? 1 : 0, "x")', 'plot(f < s and f[1] >= s[1] ? 1 : 0, "ref")'],
        ['ta.cross', 'plot(ta.cross(f, s) ? 1 : 0, "x")', 'plot((f > s and f[1] <= s[1]) or (f < s and f[1] >= s[1]) ? 1 : 0, "ref")'],
        ['ta.rising', 'plot(ta.rising(f, 2) ? 1 : 0, "x")', 'plot(f > f[1] and f[1] > f[2] ? 1 : 0, "ref")'],
        ['ta.falling', 'plot(ta.falling(f, 2) ? 1 : 0, "x")', 'plot(f < f[1] and f[1] < f[2] ? 1 : 0, "ref")'],
        ['nested in math.max(...)', 'plot(math.max(ta.crossover(f, s) ? 1 : 0, 0), "x")', 'plot(f > s and f[1] <= s[1] ? 1 : 0, "ref")'],
        ['left operand of and in the test', 'plot(ta.crossover(f, s) and close > 0 ? 1 : 0, "x")', 'plot(f > s and f[1] <= s[1] ? 1 : 0, "ref")'],
    ];
    for (const [name, inline, reference] of cases) {
        it(`${name}: inline form equals the hand-written predicate`, async () => {
            const { plots } = await mk().run(pine(6, HEADER + inline + '\n' + reference));
            const x = plots['x'].data.map((p) => p.value);
            const ref = plots['ref'].data.map((p) => p.value);
            // skip the warm-up bars where the reference's `[2]` lookups are na
            const from = 3;
            expect(x.slice(from)).toEqual(ref.slice(from));
            expect(ref.filter((v) => v === 1).length).toBeGreaterThan(0);
        });
    }
});

describe('request.* is never lazy (TradingView computes the requested expression on every bar)', () => {
    // On TradingView `cond ? request.security(sym, tf, expr) : na` equals the
    // unconditional `request.security(sym, tf, expr)` on every bar where cond
    // holds (verified on BINANCE:BTCUSDT 60 / "240": 817/817 bars). Inlining the
    // call lazily broke this: the secondary context runs the same script, so
    // `expr`'s request.param was only recorded on secondary bars where the
    // SECONDARY's cond held, misaligning what the main context reads back.
    it('request.security inside a ternary branch returns the same values as the unconditional call', async () => {
        const { plots } = await mk().run(
            pine(6, `cond = close > open
ref = request.security(syminfo.tickerid, "240", ta.sma(close, 5))
inb = cond ? request.security(syminfo.tickerid, "240", ta.sma(close, 5)) : na
plot(ref, "ref")
plot(inb, "inb")
plot(cond ? 1 : 0, "cond")`)
        );
        const ref = plots['ref'].data.map((p) => p.value);
        const inb = plots['inb'].data.map((p) => p.value);
        const cond = plots['cond'].data.map((p) => p.value);
        let compared = 0;
        for (let i = 40; i < ref.length; i++) {
            if (cond[i] === 1) {
                expect(inb[i]).toBeCloseTo(ref[i], 8);
                compared++;
            } else {
                expect(Number.isNaN(inb[i])).toBe(true);
            }
        }
        expect(compared).toBeGreaterThan(10);
    });

    it('a ternary INSIDE the request.security expression is still lazy in the secondary context', async () => {
        // `(cond ? ta.cum(1) : na) - ta.cum(cond ? 1 : 0)` is 0 on every HTF bar iff
        // the branch's ta.cum only ran on HTF bars where cond held.
        const { plots } = await mk().run(
            pine(6, `cond = close > open
d = request.security(syminfo.tickerid, "240", (cond ? ta.cum(1) : na) - ta.cum(cond ? 1 : 0))
plot(d, "d")`)
        );
        const d = plots['d'].data.map((p) => p.value).filter((v) => !Number.isNaN(v));
        expect(d.length).toBeGreaterThan(10);
        expect(d.every((v) => v === 0)).toBe(true);
    });

    it('request.security on the right of a v6 `and` is hoisted, not inlined', async () => {
        const { transpile } = await import('../../src/transpiler');
        const code = transpile(
            pine(6, `x = close > open and request.security(syminfo.tickerid, "240", close) > 0 ? 1 : 0
plot(x, "x")`)
        ).toString();
        expect(code).toMatch(/const temp_\d+ = await request\.security\(/);
    });
});

describe('switch expression arms are lazy (compiled to an IIFE with if/else)', () => {
    // A Pine `switch` used as an expression compiles to an IIFE whose arms are
    // `if (...) { return <arm> }` blocks. Calls inside those blocks used to be
    // hoisted to the IIFE body ahead of the `if`, so every arm ran on every bar.

    it('guarded array.get in a switch arm does not throw (declaration)', async () => {
        const { plots } = await mk().run(
            pine(5, `var a = array.new_float()
x = switch
    array.size(a) > 0 => array.get(a, 0)
    => na
plot(x, "x")`)
        );
        expect(plots['x'].data.every((p) => Number.isNaN(p.value))).toBe(true);
    });

    it('guarded array.get in a switch arm does not throw (reassignment)', async () => {
        const { plots } = await mk().run(
            pine(5, `var a = array.new_float()
float x = na
x := switch
    array.size(a) > 0 => array.get(a, 0)
    => -1
plot(x, "x")`)
        );
        expect(plots['x'].data.every((p) => p.value === -1)).toBe(true);
    });

    it('guarded array.get in a switch arm does not throw (function return)', async () => {
        const { plots } = await mk().run(
            pine(5, `f(arr) =>
    switch
        array.size(arr) > 0 => array.get(arr, 0)
        => na
var a = array.new_float()
plot(f(a), "x")`)
        );
        expect(plots['x'].data.every((p) => Number.isNaN(p.value))).toBe(true);
    });

    it('ta.* in a switch arm only executes on bars where the arm is taken', async () => {
        const { plots } = await mk().run(
            pine(5, `x = switch bar_index % 2
    0 => ta.cum(1)
    => -1
plot(x, "x")`)
        );
        const x = plots['x'].data.map((p) => p.value);
        expect(x.slice(0, 5)).toEqual([1, -1, 2, -1, 3]);
    });
});

describe('PineTS syntax (JavaScript semantics)', () => {
    it('?: and && are lazy', async () => {
        const { plots } = await mk().run(($) => {
            const { array, plot } = $.pine;
            var a = array.new_float();
            const x = array.size(a) > 0 ? array.get(a, 0) : NaN;
            const y = array.size(a) > 0 && array.get(a, 0) > 0;
            plot(x, 'x');
            plot(y ? 1 : 0, 'y');
            return { x, y };
        });
        expect(plots['x'].data.every((p) => Number.isNaN(p.value))).toBe(true);
        expect(plots['y'].data.every((p) => p.value === 0)).toBe(true);
    });
});

describe('unchanged: eager positions still hoist and run every bar', () => {
    it('ta.* in the ternary TEST runs every bar', async () => {
        const { plots } = await mk().run(
            pine(5, `x = ta.cum(1) >= 3 ? 1 : 0
plot(x, "x")`)
        );
        const x = plots['x'].data.map((p) => p.value);
        expect(x.slice(0, 2)).toEqual([0, 0]);
        expect(x[2]).toBe(1);
        expect(x[5]).toBe(1);
    });

    it('ta.* on the LEFT of `and` runs every bar (v6)', async () => {
        const { plots } = await mk().run(
            pine(6, `flag = ta.cum(1) >= 3 and bar_index % 2 == 0
plot(flag ? 1 : 0, "f")`)
        );
        const f = plots['f'].data.map((p) => p.value);
        expect(f[2]).toBe(1);
        expect(f[3]).toBe(0);
        expect(f[4]).toBe(1);
    });
});
