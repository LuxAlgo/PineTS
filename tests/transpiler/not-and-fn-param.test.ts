// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Regression: `not paramA and not paramB` (and the equivalent `or`-form,
 * any nesting under a logical/binary/conditional/unary expression) used
 * to skip the function-parameter Series-unwrap inside arrow-function
 * bodies. The transpiler emitted `!a && !b` where `a` / `b` are bool
 * function parameters — i.e. `Series` objects at runtime. Since `Series`
 * is truthy in JS, `!Series === false`, so the entire expression
 * collapsed to `false` and any branch gated on it was unreachable.
 *
 * This bit Smart-Money-Concepts (LuxAlgo) hard: the swing-pivot branch
 * `if not equalHighLow and not internal` never executed, leaving every
 * `trailing.*` field na/undefined. Downstream `chart.point.new(rightTimeBar,
 * na, trailing.top)` produced NaN coords, so the Strong Low / Weak High
 * labels and lines never rendered.
 *
 * Three call sites had the same gap:
 *   1. `transformVariableDeclaration` walker — for `direct = not a and not b`
 *   2. `transformExpression`            walker — for `if not a and not b`
 *   3. The arrow-function-body walker had no IfStatement.test traversal at
 *      all, so step 2's walker was never invoked for if-tests inside fn bodies.
 */

import { describe, it, expect } from 'vitest';
import { transpile } from '../../src/transpiler/index';
import { PineTS, Provider } from 'index';

const makePineTS = () =>
    new PineTS(
        Provider.Mock,
        'BTCUSDC',
        'D',
        null,
        new Date('2019-01-01').getTime(),
        new Date('2019-01-15').getTime(),
    );

describe('`not param` inside logical expressions in fn bodies', () => {
    // ─────────────────────────────────────────────────────────────────────
    // Codegen shape
    // ─────────────────────────────────────────────────────────────────────
    it('unwraps both operands of `not a and not b` in a variable-declaration RHS', () => {
        const code = `
//@version=5
indicator("x")
f(bool a = false, bool b = false) =>
    direct = not a and not b
    direct
f(false, false)
`;
        const js = transpile(code).toString();
        expect(js).toContain('!$.get(a, 0) && !$.get(b, 0)');
        // Defensive: must NOT emit the bare-identifier form.
        expect(js).not.toMatch(/\$\.init\([^,]+,\s*!a\s*&&\s*!b\)/);
    });

    it('unwraps both operands of `not a and not b` inside an if-test in a fn body', () => {
        const code = `
//@version=5
indicator("x")
f(bool a = false, bool b = false) =>
    int v = 0
    if not a and not b
        v := 1
    v
f(false, false)
`;
        const js = transpile(code).toString();
        expect(js).toContain('if (!$.get(a, 0) && !$.get(b, 0))');
        expect(js).not.toMatch(/if\s*\(\s*!a\s*&&\s*!b\s*\)/);
    });

    it('unwraps both operands of `not a or not b` (or-form)', () => {
        const code = `
//@version=5
indicator("x")
f(bool a = false, bool b = false) =>
    or_form = not a or not b
    or_form
f(false, true)
`;
        const js = transpile(code).toString();
        expect(js).toContain('!$.get(a, 0) || !$.get(b, 0)');
    });

    // ─────────────────────────────────────────────────────────────────────
    // Runtime behaviour — the actual bite
    // ─────────────────────────────────────────────────────────────────────
    it('runtime: `not a and not b` evaluates correctly across all four bool combinations', async () => {
        const code = `
//@version=5
indicator("not-and runtime", overlay=false)

probe(bool a, bool b) =>
    direct = not a and not b
    if_taken = 0
    if not a and not b
        if_taken := 1
    [direct ? 1 : 0, if_taken]

[d_ff, b_ff] = probe(false, false)
[d_tf, b_tf] = probe(true,  false)
[d_ft, b_ft] = probe(false, true)
[d_tt, b_tt] = probe(true,  true)

plot(d_ff, "d_ff")
plot(b_ff, "b_ff")
plot(d_tf, "d_tf")
plot(d_ft, "d_ft")
plot(d_tt, "d_tt")
`;
        const { plots } = await makePineTS().run(code);
        const last = (k: string) => {
            const d = plots[k]?.data;
            return d?.[d.length - 1].value;
        };
        // Truth table for `not a and not b`: only true when a=false,b=false.
        expect(last('d_ff')).toEqual(1);
        expect(last('b_ff')).toEqual(1);   // if-branch taken
        expect(last('d_tf')).toEqual(0);
        expect(last('d_ft')).toEqual(0);
        expect(last('d_tt')).toEqual(0);
    });

    // ─────────────────────────────────────────────────────────────────────
    // Higher-arity / nested chains — make sure the parent-threading
    // recursion works to arbitrary depth, not just one level of `not`.
    // ─────────────────────────────────────────────────────────────────────
    it('runtime: chained `not a and not b and not c`', async () => {
        const code = `
//@version=5
indicator("triple not")

probe3(bool a, bool b, bool c) =>
    cond = not a and not b and not c
    cond ? 1 : 0

v_fff = probe3(false, false, false)
v_tff = probe3(true,  false, false)
v_ftt = probe3(false, true,  true)

plot(v_fff, "v_fff")
plot(v_tff, "v_tff")
plot(v_ftt, "v_ftt")
`;
        const { plots } = await makePineTS().run(code);
        const last = (k: string) => {
            const d = plots[k]?.data;
            return d?.[d.length - 1].value;
        };
        expect(last('v_fff')).toEqual(1);
        expect(last('v_tff')).toEqual(0);
        expect(last('v_ftt')).toEqual(0);
    });
});
