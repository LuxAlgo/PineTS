// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Indentation and line-wrapping parity with TradingView.
 *
 * Every script below was run on TradingView (tv-extractor, Sep 2026) and the
 * expected values / accept-reject verdicts come from there. The rules the
 * probes established:
 *
 *   - Indentation is measured in columns; a tab is four columns, fixed (not a
 *     tab stop): `  \t` and `\t  ` both measure six.
 *   - A multiple of four is a block level. One level deeper than the enclosing
 *     block opens a local block; more than one is rejected ("Mismatched input
 *     ... expecting 'end of line without line continuation'").
 *   - Any other width is LINE WRAPPING: the line continues the previous one,
 *     whatever it starts with (`- r2`, `.size()`, `2`). If the joined line is
 *     not valid syntax TradingView rejects it as a syntax error.
 *   - A line at the block indent is always a new statement, so `-x` after
 *     `x = 1` is a unary statement, not `x = 1 - x`.
 *   - Triple-quoted strings are literal text, newlines and leading spaces
 *     included.
 *
 * Production scripts failed with "Unexpected token INDENT ''" on the wrapped
 * shapes (a leading operator aligned under the right-hand side, an operand on
 * its own line) and, worse, two shapes were accepted with the WRONG value:
 * a 2-space continuation inside a block dedented out of the block, and a
 * `-x` statement was folded into the previous assignment.
 */

import { describe, it, expect } from 'vitest';
import { pineToJS } from '../../src/transpiler/pineToJS/pineToJS.index';
import { PineTS, Provider } from 'index';

const HEADER = ['//@version=6', 'indicator("indent parity")'];

function source(lines: string[], header = HEADER) {
    return [...header, ...lines].join('\n') + '\n';
}

// First five bars of `v` (bar_index 0..4). Everything here depends only on bar_index.
async function firstValues(lines: string[], header = HEADER): Promise<number[]> {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-03').getTime());
    const { plots } = await pineTS.run(source([...lines, 'plot(v, "v")'], header));
    return plots['v'].data.slice(0, 5).map((d: any) => d.value);
}

function transpileError(lines: string[], header = HEADER): string {
    const r = pineToJS(source(lines, header));
    expect(r.success).toBe(false);
    return r.error as string;
}

describe('Line wrapping: indentation that is not a multiple of four continues the previous line', () => {
    it('leading operator aligned under the right-hand side, inside a function body (production report #5)', async () => {
        const v = await firstValues([
            'f() =>',
            '    r2    = math.pow(  bar_index / (2.0 ',
            '                           *  1.5), 2)',
            '    rss   = 10.0  ',
            '          - r2 ',
            '          * 2.0',
            '    rss',
            'v = f()',
        ]);
        const expected = [10, 9.7777777778, 9.1111111111, 8, 6.4444444444];
        v.forEach((x, i) => expect(x).toBeCloseTo(expected[i], 9));
    });

    it('assignment with nothing after `=`, operand at 11 columns and operator at 9 (production report #6)', async () => {
        expect(
            await firstValues([
                'f() =>',
                '    point1 = bar_index',
                '    point2 = 1',
                '    j    = ',
                '           point1 ',
                '         - point2 ',
                '',
                '    j',
                'v = f()',
            ])
        ).toEqual([-1, 0, 1, 2, 3]);
    });

    it('a 2-space continuation inside a 4-space block stays in the statement (was silently 1 instead of 3)', async () => {
        expect(
            await firstValues([
                'v = 0',
                'if bar_index > 0',
                '    v := 1',
                '  + 2',
            ])
        ).toEqual([0, 3, 3, 3, 3]);
    });

    it('wrapped `for` header', async () => {
        expect(
            await firstValues([
                'v = 0',
                'for i = 0 to',
                '      2',
                '    v := v + i',
            ])
        ).toEqual([3, 3, 3, 3, 3]);
    });

    it('wrapped method call with the `.` at the start of the line', async () => {
        expect(
            await firstValues([
                'arr = array.from(1, 2, bar_index)',
                'v = arr',
                '  .size()',
            ])
        ).toEqual([3, 3, 3, 3, 3]);
    });

    it('docs example: 2 / 5 / 10-space continuation after trailing operators', async () => {
        expect(
            await firstValues([
                'float v = bar_index + 1 +',
                '  2 +',
                '     3 +',
                '          4',
            ])
        ).toEqual([10, 11, 12, 13, 14]);
    });

    it('leading `+`, leading `? :`, leading `and` / `or`, leading `(`', async () => {
        expect(await firstValues(['v = bar_index', '  + 2'])).toEqual([2, 3, 4, 5, 6]);
        expect(await firstValues(['v = bar_index > 2', '  ? 1', '  : 0'])).toEqual([0, 0, 0, 1, 1]);
        expect(
            await firstValues(['c = bar_index > 1', '  and bar_index < 4', '  or bar_index == 0', 'v = c ? 1 : 0'])
        ).toEqual([1, 0, 1, 1, 0]);
        expect(await firstValues(['v = 2 *', '  (bar_index + 1)'])).toEqual([2, 4, 6, 8, 10]);
    });

    it('wrapped `if` condition, then a normal body', async () => {
        expect(
            await firstValues(['v = 0', 'if bar_index > 1 and', '   bar_index < 4', '    v := 1'])
        ).toEqual([0, 0, 1, 1, 0]);
    });

    it('trailing comments on wrapped lines, and a comment-only line between wrapped lines', async () => {
        expect(
            await firstValues(['v = bar_index + // first', '  2 + // second', '     3'])
        ).toEqual([5, 6, 7, 8, 9]);
        expect(await firstValues(['v = bar_index +', '  // note', '  2'])).toEqual([2, 3, 4, 5, 6]);
    });

    it('wrapped tuple return and wrapped tuple destructuring', async () => {
        expect(
            await firstValues(['f() => [bar_index,', '  bar_index * 2]', '[a,', '  b] = f()', 'v = a + b'])
        ).toEqual([0, 3, 6, 9, 12]);
    });

    it('wrapped expression inside a switch arm', async () => {
        expect(
            await firstValues(['v = switch bar_index', '    0 => 10 +', '          1', '    => 5'])
        ).toEqual([11, 5, 5, 5, 5]);
    });

    it('docs example: wrapped ternary inside a local block at 6 spaces', async () => {
        expect(
            await firstValues([
                'upDown(float s) =>',
                '    var int ud = 0',
                '    bool isEqual = s == s[1]',
                '    bool isGrowing = s > s[1]',
                '    ud := isEqual ? 0 : isGrowing ? (ud <= 0 ? 1 : ud + 1) :',
                '      (ud >= 0 ? -1 : ud - 1)',
                '    ud',
                'v = upDown(bar_index)',
            ])
        ).toEqual([-1, 1, 2, 3, 4]);
    });
});

describe('A line at the block indent is a new statement', () => {
    it('`-x` after `x = 1` is a unary statement (was folded into `x = 1 - x` → NaN)', async () => {
        expect(
            await firstValues(['f() =>', '    x = 1', '    -x', 'v = f() + bar_index'])
        ).toEqual([-1, 0, 1, 2, 3]);
    });

    it('a negative switch test value after a single-line arm is a new arm', async () => {
        expect(
            await firstValues(['v = switch bar_index - 1', '    1 => 10', '    -1 => 20', '    => 5'])
        ).toEqual([20, 5, 10, 5, 5]);
    });
});

describe('Tabs count as four columns', () => {
    it('tab-indented block, tab and four spaces mixed in one block', async () => {
        expect(await firstValues(['v = 0', 'if bar_index > 0', '\tv := 1'])).toEqual([0, 1, 1, 1, 1]);
        expect(await firstValues(['v = 0', 'if bar_index > 0', '\tv := 1', '    v := v + 1'])).toEqual([0, 2, 2, 2, 2]);
    });

    it('tab header with an 8-space nested body, and 4 spaces + tab as the second level', async () => {
        expect(
            await firstValues(['v = 0', 'if bar_index > 0', '\tif bar_index > 1', '        v := 2'])
        ).toEqual([0, 0, 2, 2, 2]);
        expect(
            await firstValues(['v = 0', 'if bar_index > 0', '    if bar_index > 1', '    \tv := 2'])
        ).toEqual([0, 0, 2, 2, 2]);
    });

    it('nested if/else with tabs, type fields with tabs, tab + 2 spaces as a wrap', async () => {
        expect(
            await firstValues(['v = 0', 'if bar_index > 0', '\tif bar_index > 1', '\t\tv := 2', '\telse', '\t\tv := 1'])
        ).toEqual([0, 1, 2, 2, 2]);
        expect(
            await firstValues(['type P', '\tint a', '\tfloat b', 'p = P.new(bar_index, 1.5)', 'v = p.a + p.b'])
        ).toEqual([1.5, 2.5, 3.5, 4.5, 5.5]);
        expect(await firstValues(['v = bar_index +', '\t  2'])).toEqual([2, 3, 4, 5, 6]);
    });
});

describe('Multiline strings', () => {
    it('triple-quoted strings are literal text including newlines and leading spaces', async () => {
        // "\n  Bar is falling.\n" is 19 characters, "\n  Bar is rising.\n" is 18.
        expect(
            await firstValues([
                'string t = bar_index > 2 ? """',
                '  Bar is rising.',
                '""" : """',
                '  Bar is falling.',
                '"""',
                'v = str.length(t)',
            ])
        ).toEqual([19, 19, 19, 18, 18]);
    });

    it('backslash escapes are still processed inside a multiline string', async () => {
        // TradingView: str.length("""a\nb""") == 3
        expect(await firstValues(['string t = """a\\nb"""', 'v = str.length(t)'])).toEqual([3, 3, 3, 3, 3]);
    });
});

describe('Layout that carries no block structure', () => {
    it('a column-0 comment inside a block does not end it (production report #1, valid variant)', async () => {
        expect(
            await firstValues([
                'v = 0',
                'if bar_index >= 0',
                '    v := 1',
                '//Pushing Zones to Zone Array for Management',
                '    if bar_index > 0',
                '        v := 2',
            ])
        ).toEqual([1, 2, 2, 2, 2]);
    });

    it('an indented comment on the first line of the file (production report #2)', async () => {
        expect(
            await firstValues(['v = bar_index'], [
                '    // This work is licensed under a Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)',
                '// © LuxAlgo',
                '',
                '//@version=6',
                'indicator("indent parity")',
            ])
        ).toEqual([0, 1, 2, 3, 4]);
    });

    it('inside parentheses any indentation is allowed, including multiples of four and `)` at column 0', async () => {
        expect(await firstValues(['float v = (bar_index + 1', '    + 2', '    + 3)'])).toEqual([6, 7, 8, 9, 10]);
        expect(await firstValues(['v = math.max(bar_index,', '    2,', '        3)'])).toEqual([3, 3, 3, 3, 4]);
        expect(
            await firstValues(['f() =>', '    x = math.max(', '        bar_index,', '        2', '    )', '    x', 'v = f()'])
        ).toEqual([2, 2, 2, 3, 4]);
        expect(
            await firstValues([
                'float x = bar_index',
                'plot(',
                ' series = x,',
                '   title = "Sum OHLC",',
                '    color = (x >= x[1] ? color.green : color.red),',
                '        linewidth = 4,',
                '    style = plot.style_stepline',
                ')',
                'v = x',
            ])
        ).toEqual([0, 1, 2, 3, 4]);
    });
});

describe('Rejected like TradingView', () => {
    it('a statement indented as a block where none was opened (production reports #1, #4)', () => {
        expect(transpileError(['v = 0', '//Pushing Zones', '    if bar_index > 0', '        v := 1'])).toMatch(
            /Unexpected indentation at 5:5 - 'if' is indented as a local block/
        );
        expect(
            transpileError(['v = 0', 'w = 0', 'if bar_index > 0', '    v := 1', '        w := 2'])
        ).toMatch(/Unexpected indentation at 7:9 - 'w' is indented as a local block/);
    });

    it('an indented declaration statement (variant of production report #2)', () => {
        expect(transpileError([], ['//@version=6', '    indicator("indent parity")', 'v = 1'])).toMatch(
            /Unexpected indentation at 2:5 - 'indicator'/
        );
    });

    it('tab / spaces+tab escalating one level per line (production report #3, v5)', () => {
        expect(
            transpileError(
                [
                    'supertrend(_src, factor) =>',
                    '\tatrat = _src + 1',
                    '    \tupperBand = _src + factor * atrat',
                    '        \tlowerBand = _src - factor * atrat',
                    '            \t[upperBand, lowerBand]',
                    '[u, l] = supertrend(bar_index, 2)',
                ],
                ['//@version=5', 'indicator("x")']
            )
        ).toMatch(/Unexpected indentation at 5:6 - 'upperBand'/);
    });

    it('the rest of the file stuck at 10 columns after wrapped call arguments (production report #7)', () => {
        expect(
            transpileError([], [
                '//@version=6',
                'indicator("x", overlay=true, max_lines_count=10,',
                '     max_labels_count=10,',
                '          max_boxes_count=10)',
                '',
                '          // ======== INPUTS ========',
                '          int maxTrades = input.int(1, "Max/day")',
                '          plot(maxTrades)',
            ])
        ).toMatch(/'int' at 7:11 - line 7 is indented by 10 columns, which is not a multiple of four, so it continues line 4/);
    });

    it('switch arms each four spaces deeper than the previous (production report #8)', () => {
        expect(
            transpileError(['v = switch bar_index', '    0 => 10', '        1 => 30', '            2 => 50', '                => 100'])
        ).toMatch(/Unexpected indentation at 5:9 - '1'/);
    });

    it('two-space step inside a nested for (production report #9)', () => {
        expect(
            transpileError([
                'v = 0',
                'if bar_index >= 0',
                '    for i = 0 to 1',
                '        int a = i',
                '        for j = 0 to 1',
                '          int b = j',
                '            if a + b > 0',
                '                v := v + a + b',
            ])
        ).toMatch(/'int' at 8:11 - line 8 is indented by 10 columns, which is not a multiple of four, so it continues line 7/);
    });

    it('next statement kept at the deepest argument indent (production report #10)', () => {
        expect(
            transpileError([
                'int a = input.int(5, "A",',
                '     minval = 1,',
                '          maxval = 20,',
                '               group = "core",',
                '                    tooltip = "Controls the ATR multiplier.")',
                '                    int b = input.int(',
                '                         10,',
                '                              "Signal Tuner (ATR Length)",',
                '                                   minval = 1)',
                'v = a + b',
            ])
        ).toMatch(/Indentation error at 8:21 - line is indented by 20 columns, but a local block must be indented by exactly one level/);
    });

    it('a block body more than one level deeper than its header', () => {
        expect(transpileError(['v = 0', 'if bar_index > 0', '        v := 1'])).toMatch(
            /Indentation error at 5:9 - line is indented by 8 columns/
        );
        expect(transpileError(['f() =>', '        bar_index + 1', 'v = f()'])).toMatch(
            /Indentation error at 4:9 - line is indented by 8 columns/
        );
    });

    it('a block body at 2 or 6 columns is wrapped onto the header and rejected', () => {
        expect(transpileError(['v = 0', 'if bar_index > 0', '      v := 1'])).toMatch(
            /'v' at 5:7 - line 5 is indented by 6 columns, which is not a multiple of four, so it continues line 4/
        );
        expect(transpileError(['v = 0', 'if bar_index > 0', '  v := 1'])).toMatch(/line 5 is indented by 2 columns/);
        // Two spaces + tab and tab + two spaces both measure six columns.
        expect(transpileError(['v = 0', 'if bar_index > 0', '  \tv := 1'])).toMatch(/line 5 is indented by 6 columns/);
        expect(transpileError(['v = 0', 'if bar_index > 0', '\t  v := 1'])).toMatch(/line 5 is indented by 6 columns/);
    });

    it('a second statement at 6 columns inside a block, or at 2 columns after a block', () => {
        expect(transpileError(['v = 0', 'if bar_index > 0', '    v := 1', '      v := 2'])).toMatch(
            /'v' at 6:7 - line 6 is indented by 6 columns/
        );
        expect(transpileError(['v = 0', 'if bar_index > 0', '    v := 1', '  w = 3'])).toMatch(
            /'w' at 6:3 - line 6 is indented by 2 columns/
        );
    });

    it('a leading operator on a multiple-of-four line is not a continuation', () => {
        expect(transpileError(['v = bar_index', '    + 2'])).toMatch(/Unexpected indentation at 4:5 - '\+'/);
        expect(transpileError(['f() =>', '    x = bar_index', '        + 2', '    x', 'v = f()'])).toMatch(
            /Unexpected indentation at 5:9 - '\+'/
        );
        expect(transpileError(['v = 0', 'if bar_index > 0', '    and bar_index < 3', '    v := 1'])).toMatch(/'and'/);
    });
});

describe('Deliberately more lenient than TradingView', () => {
    // TradingView rejects a continuation that lands on a multiple-of-four
    // column even after a trailing operator ("Syntax error at input 'end of
    // line without line continuation'"). The intent is unambiguous — a line
    // ending in a binary operator cannot be complete — and existing scripts
    // written against PineTS rely on it, so it stays accepted.
    it('continuation after a trailing operator onto a multiple-of-four column', async () => {
        expect(await firstValues(['v = bar_index +', '    2'])).toEqual([2, 3, 4, 5, 6]);
        expect(await firstValues(['f() =>', '    x = bar_index +', '        2', '    x', 'v = f()'])).toEqual([2, 3, 4, 5, 6]);
    });
});
