// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Regression: a COMMENT-ONLY line used to move the lexer's indent stack.
 *
 * `handleIndentation()` already ignored blank lines, but a line holding
 * nothing but a `//` comment was measured like a statement. A commented-out
 * statement left a column or two shallower than the block it sits in — very
 * common, since people comment a line out by typing `//` in front of the
 * existing text and then deleting a space, or by pasting at the wrong depth —
 * DEDENTed out of the block. The next real statement, back at the block's own
 * indent, then emitted an INDENT where the parser expects a statement:
 *
 *     Failed to transpile Pine Script version 6: Unexpected token INDENT '' at L:C
 *
 * Found on [VxV]Probability Engine v5, which fails to load at line 1515 over a
 * commented-out `table.cell(...)` at 7 spaces inside an 8-space `if` body. The
 * script compiles on TradingView, which ignores comment lines for indentation.
 *
 * The quiet half matters more than the loud one: when the comment's column
 * happens to land ON an enclosing indent level, there is no error at all — the
 * block just ends early and the remaining statements move up a scope.
 *
 * Fix: `handleIndentation()` returns before touching the indent stack when the
 * first non-whitespace characters on the line are `//` — exactly the blank-line
 * path. The parser already treats COMMENT as a layout token, so a DEDENT that
 * now lands after the comment instead of before it changes nothing.
 */

import { describe, it, expect } from 'vitest';
import { pineToJS } from '../../src/transpiler/pineToJS/pineToJS.index';
import { PineTS, Provider } from 'index';

const makePineTS = () =>
    new PineTS(Provider.Mock, 'BTCUSDC', 'D', null,
        new Date('2019-01-01').getTime(),
        new Date('2019-01-15').getTime());

describe('Comment-only lines do not carry indentation', () => {
    it('a comment SHALLOWER than its block does not break the block', () => {
        const code = `
//@version=6
indicator("x")
f(int x) =>
    int a = x + 1
   // a commented-out statement, one column shallow
    int b = a + 1
    b
plot(f(5))
`;
        const r = pineToJS(code);
        expect(r.success).toBe(true);
        const js = r.code as string;
        const fnStart = js.indexOf('function f(x) {');
        expect(fnStart).toBeGreaterThanOrEqual(0);
        const body = js.slice(fnStart, js.indexOf('}', fnStart));
        expect(body).toContain('let b = a + 1');
    });

    it('a comment DEEPER than its block does not open one', () => {
        const code = `
//@version=6
indicator("x")
if close > open
    x = 1
            // an over-indented note
    y = x + 1
    plot(y)
`;
        expect(pineToJS(code).success).toBe(true);
    });

    it('a comment at an ENCLOSING level does not close the block early', () => {
        // The silent half: 4 spaces is a real indent level here, so the old
        // lexer DEDENTed without error and `int b` escaped the function —
        // referencing `a`, which is out of scope there.
        const code = `
//@version=6
indicator("x")
f(int x) =>
    if x > 0
        int a = x + 1
    // note at the function-body level, inside the if-block
        int b = a + 1
        b
    else
        0
plot(f(5))
`;
        const r = pineToJS(code);
        expect(r.success).toBe(true);
        const js = r.code as string;
        const fnStart = js.indexOf('function f(x) {');
        expect(fnStart).toBeGreaterThanOrEqual(0);
        // `int b` must still be inside the function, not hoisted past it.
        expect(js.indexOf('let b = a + 1')).toBeGreaterThan(fnStart);
    });

    it('a real DEDENT is still honoured when the comment is followed by shallower code', () => {
        // Negative control: the guard must not swallow a genuine dedent.
        // `z` is top-level; if the lexer stopped emitting DEDENTs at all,
        // it would be parsed into the if-body instead.
        const code = `
//@version=6
indicator("x")
if close > open
    x = 1
// back at column 0
z = 2
plot(z)
`;
        const r = pineToJS(code);
        expect(r.success).toBe(true);
        const js = r.code as string;
        const ifIdx = js.indexOf('if (');
        const zIdx = js.indexOf('z = 2');
        expect(ifIdx).toBeGreaterThanOrEqual(0);
        expect(zIdx).toBeGreaterThan(ifIdx);
        // `z = 2` must sit outside the if-block's braces.
        expect(js.slice(ifIdx, zIdx)).toContain('}');
    });

    it('runtime: the block after a misaligned comment still executes', async () => {
        const code = `
//@version=6
indicator("x")

probe(int a, int b) =>
    int s = a + b
  // a stray note at an odd column
    int t = s * 2
    [s, t]

[sv, tv] = probe(3, 4)

plot(sv, "sv")
plot(tv, "tv")
`;
        const { plots } = await makePineTS().run(code);
        const last = (k: string) => {
            const d = plots[k]?.data;
            return d?.[d.length - 1].value;
        };
        expect(last('sv')).toEqual(7);
        expect(last('tv')).toEqual(14);
    });
});
