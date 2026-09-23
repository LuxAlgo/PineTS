// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Where inputs can be declared and how their arguments are evaluated.
 *
 * TradingView declares an input at compile time wherever its call sits —
 * local blocks, switch arms, function bodies, or directly as an argument —
 * numbers them in_0, in_1, … in source order, labels them by title, assigned
 * variable, enclosing function or "untitled", and folds their arguments as
 * constants. Input arguments only see constants, and function parameter
 * defaults must be literals or built-in variables.
 */

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';
import { Provider } from '../../../src/marketData/Provider.class';
import { Indicator } from '../../../src/Indicator';
import { transpile } from '../../../src/transpiler/index';

const pine = (...lines: string[]) => ['//@version=6', 'indicator("t")', ...lines].join('\n') + '\n';

/** `[id, name, type, defval]` per declared input. */
const declared = (...lines: string[]) => new Indicator(pine(...lines)).getInputsMeta().map((m) => [m.id, m.name, m.type, m.defval]);

const defval = (...lines: string[]) => {
    const meta = new Indicator(pine(...lines)).getInputsMeta();
    expect(meta).toHaveLength(1);
    return meta[0].defval;
};

/** First `n` values of each named plot. */
async function firstValues(ind: Indicator, names: string[], n = 3): Promise<Record<string, number[]>> {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-03').getTime());
    const { plots } = await pineTS.run(ind);
    return Object.fromEntries(names.map((name) => [name, plots[name].data.slice(0, n).map((p: any) => p.value)]));
}

const plotted = (names: string[]) => names.map((n) => `plot(${n}, "${n}")`);

describe('input declarations: ids and labels', () => {
    it('an input passed directly as an argument is declared and labelled "untitled"', () => {
        expect(declared('plot(ta.sma(close, input(14)) - ta.sma(close, input(28)))')).toEqual([
            ['in_0', 'untitled', 'int', 14],
            ['in_1', 'untitled', 'int', 28],
        ]);
        expect(declared('plot(input(14), "x")')).toEqual([['in_0', 'untitled', 'int', 14]]);
        expect(declared('if input(true)', '    label.new(bar_index, close)', 'plot(na)')).toEqual([['in_0', 'untitled', 'bool', true]]);
    });

    it('an argument input with a title is labelled by its title', () => {
        expect(declared('plot(ta.sma(close, input.int(14, "Len")))')).toEqual([['in_0', 'Len', 'int', 14]]);
    });

    it('an untitled input takes the name of the variable it is assigned to, anywhere in the expression', () => {
        expect(declared('len = input(14)', 'plot(len)')).toEqual([['in_0', 'len', 'int', 14]]);
        expect(declared('a = 1 + input(14)', 'plot(a)')).toEqual([['in_0', 'a', 'int', 14]]);
        expect(declared('a = ta.sma(close, input(14))', 'plot(a)')).toEqual([['in_0', 'a', 'int', 14]]);
        expect(declared('var k = input(14)', 'plot(k)')).toEqual([['in_0', 'k', 'int', 14]]);
        expect(declared('k = 1', 'k := input(5)', 'plot(k)')).toEqual([['in_0', 'k', 'int', 5]]);
    });

    it('an explicitly empty title stays empty', () => {
        expect(declared('k = input.int(14, "")', 'plot(k)')).toEqual([['in_0', '', 'int', 14]]);
    });

    it('an input inside a function takes the function name unless assigned inside it', () => {
        expect(declared('f() => input(14)', 'plot(f() + f())')).toEqual([['in_0', 'f', 'int', 14]]);
        expect(declared('f() => ta.sma(close, input(14))', 'plot(f())')).toEqual([['in_0', 'f', 'int', 14]]);
        expect(declared('f() =>', '    y = 1', '    input(14) + y', 'plot(f())')).toEqual([['in_0', 'f', 'int', 14]]);
        expect(declared('f() =>', '    x = input(14)', '    x', 'plot(f())')).toEqual([['in_0', 'x', 'int', 14]]);
        expect(declared('f() =>', '    r = 0', '    if close > open', '        r := input(2)', '    r', 'plot(f())')).toEqual([
            ['in_0', 'r', 'int', 2],
        ]);
        expect(declared('f(x) => x + input.int(14, "Off")', 'plot(f(1) + f(2))')).toEqual([['in_0', 'Off', 'int', 14]]);
        expect(declared('method m(float x) => x + input(3)', 'plot(close.m())')).toEqual([['in_0', 'm', 'int', 3]]);
    });

    it('an input in a function body is declared even if the function is never called', () => {
        expect(declared('f() => input(14)', 'plot(close)')).toEqual([['in_0', 'f', 'int', 14]]);
    });

    it('ids follow source order across functions, local blocks and the global scope', () => {
        expect(declared('f() => input(9)', 'k = 0', 'if close > open', '    k := input(1)', 'z = input(2)', 'plot(k + z + f())')).toEqual([
            ['in_0', 'f', 'int', 9],
            ['in_1', 'k', 'int', 1],
            ['in_2', 'z', 'int', 2],
        ]);
    });
});

describe('input declarations: local scopes', () => {
    it('an input inside an if block is declared', () => {
        expect(declared('var k = 0', 'if barstate.isfirst', '    k := input(14)', 'plot(ta.sma(close, k))')).toEqual([['in_0', 'k', 'int', 14]]);
        expect(declared('k = 0', 'if barstate.isfirst', '    j = input(14)', '    k := j', 'plot(k)')).toEqual([['in_0', 'j', 'int', 14]]);
        expect(declared('k = 0', 'if close > open', '    if high > low', '        k := input(3)', 'plot(k)')).toEqual([['in_0', 'k', 'int', 3]]);
    });

    it('an if whose condition is only false at runtime still declares its input', () => {
        expect(declared('var k = 0', 'if close < 0', '    k := input(14)', 'plot(k)')).toEqual([['in_0', 'k', 'int', 14]]);
    });

    it('a branch whose condition is a constant false drops its inputs', () => {
        expect(declared('var k = 0', 'if false', '    k := input(14)', 'plot(k)')).toEqual([]);
        expect(declared('C = false', 'k = 0', 'if C', '    k := input(1)', 'plot(k)')).toEqual([]);
        expect(declared('k = 0', 'if false and close > open', '    k := input(1)', 'plot(k)')).toEqual([]);
        expect(declared('k = 0', 'if false', '    k := input(1)', 'else', '    k := input(2)', 'plot(k)')).toEqual([['in_0', 'k', 'int', 2]]);
        expect(declared('k = 0', 'if true', '    k := input(1)', 'plot(k)')).toEqual([['in_0', 'k', 'int', 1]]);
        expect(
            declared('k = 0', 'if close > open', '    k := input(1)', 'else if false', '    k := input(2)', 'else', '    k := input(3)', 'plot(k)'),
        ).toEqual([
            ['in_0', 'k', 'int', 1],
            ['in_1', 'k', 'int', 3],
        ]);
    });

    it('every branch of an if/else with a runtime condition declares its inputs', () => {
        expect(declared('k = 0', 'if close > open', '    k := input(1)', 'else', '    k := input(2)', 'plot(k)')).toEqual([
            ['in_0', 'k', 'int', 1],
            ['in_1', 'k', 'int', 2],
        ]);
    });

    it('switch arms declare their inputs; a constant subject keeps only the selected arm', () => {
        expect(declared('m = close > open ? "a" : "b"', 'k = switch m', '    "a" => input(10)', '    => input(20)', 'plot(k)')).toEqual([
            ['in_0', 'k', 'int', 10],
            ['in_1', 'k', 'int', 20],
        ]);
        expect(declared('m = "a"', 'k = switch m', '    "a" => input(10)', '    => input(20)', 'plot(k)')).toEqual([['in_0', 'k', 'int', 10]]);
        expect(declared('k = switch', '    false => input(1)', '    => input(2)', 'plot(k)')).toEqual([['in_0', 'k', 'int', 2]]);
    });

    it('ternary branches declare their inputs; a constant condition keeps one', () => {
        expect(declared('k = close > open ? input(1) : input(2)', 'plot(k)')).toEqual([
            ['in_0', 'k', 'int', 1],
            ['in_1', 'k', 'int', 2],
        ]);
        expect(declared('k = true ? input(1) : input(2)', 'plot(k)')).toEqual([['in_0', 'k', 'int', 1]]);
    });

    it('an input inside a loop is declared once and may use constants declared in the loop', () => {
        expect(declared('for i = 0 to 9', '    k = input(5)', 'plot(na)')).toEqual([['in_0', 'k', 'int', 5]]);
        expect(declared('for i = 0 to 9', '    y = 4', '    k = input(y)', 'plot(na)')).toEqual([['in_0', 'k', 'int', 4]]);
        expect(declared('c = 0', 'while c < 2', '    y = 4', '    k = input(y)', '    c += 1', 'plot(na)')).toEqual([['in_0', 'k', 'int', 4]]);
        expect(declared('k = 0', 'if barstate.isfirst', '    y = 5', '    k := input(y)', 'plot(k)')).toEqual([['in_0', 'k', 'int', 5]]);
    });

    it('a loop bound written as an input is a single input', () => {
        expect(declared('s = 0', 'for i = 0 to input(2)', '    s += i', 'plot(s)')).toEqual([['in_0', 'untitled', 'int', 2]]);
    });
});

describe('input declarations: compile-time evaluation of arguments', () => {
    it('folds arithmetic, constants and ternaries', () => {
        expect(defval('k = input(2 + 2)', 'plot(k)')).toBe(4);
        expect(defval('k = input(-5)', 'plot(k)')).toBe(-5);
        expect(defval('k = input(10 % 3)', 'plot(k)')).toBe(1);
        expect(defval('L = 7', 'k = input(L * 2)', 'plot(k)')).toBe(14);
        expect(defval('var L = 7', 'k = input(L)', 'plot(k)')).toBe(7);
        expect(defval('k = input(true ? 3 : 4)', 'plot(k)')).toBe(3);
        expect(defval('b = input(not false)', 'plot(b ? 1 : 0)')).toBe(true);
        expect(defval('b = input(3 > 2)', 'plot(b ? 1 : 0)')).toBe(true);
    });

    it('divides int constants fractionally and truncates an int-typed result', () => {
        expect(declared('k = input(7 / 2)', 'plot(k)')).toEqual([['in_0', 'k', 'int', 3]]);
        expect(declared('k = input(1 / 2 * 4)', 'plot(k)')).toEqual([['in_0', 'k', 'int', 2]]);
        expect(declared('k = input(10 / 4)', 'plot(k)')).toEqual([['in_0', 'k', 'int', 2]]);
        expect(declared('L = 7 / 2', 'k = input(L)', 'plot(k)')).toEqual([['in_0', 'k', 'int', 3]]);
        expect(declared('k = input.float(7 / 2)', 'plot(k)')).toEqual([['in_0', 'k', 'float', 3]]);
        expect(declared('k = input(7 / 2.0)', 'plot(k)')).toEqual([['in_0', 'k', 'float', 3.5]]);
        expect(declared('k = input(float(7) / 2)', 'plot(k)')).toEqual([['in_0', 'k', 'float', 3.5]]);
        expect(new Indicator(pine('k = input.float(1.0, minval = 1 / 2)', 'plot(k)')).getInputsMeta()[0].minval).toBe(0);
    });

    it('folds built-in function calls', () => {
        expect(declared('k = input.float(math.pi * 2)', 'plot(k)')).toEqual([['in_0', 'k', 'float', 6.283185307179586]]);
        expect(declared('k = input.int(math.max(3, 5))', 'plot(k)')).toEqual([['in_0', 'k', 'int', 5]]);
        expect(declared('k = input(math.round(2.6))', 'plot(k)')).toEqual([['in_0', 'k', 'int', 3]]);
        expect(declared('k = input(math.round(3.14159, 2))', 'plot(k)')).toEqual([['in_0', 'k', 'float', 3.14]]);
        expect(declared('k = input.float(math.sqrt(16))', 'plot(k)')).toEqual([['in_0', 'k', 'float', 4]]);
        expect(declared('k = input(math.pow(2, 3))', 'plot(k)')).toEqual([['in_0', 'k', 'float', 8]]);
        expect(declared('k = input(math.log(math.e))', 'plot(k)')).toEqual([['in_0', 'k', 'float', 1]]);
        expect(declared('k = input(math.abs(-3))', 'plot(k)')).toEqual([['in_0', 'k', 'int', 3]]);
        expect(declared('k = input(int(3.7))', 'plot(k)')).toEqual([['in_0', 'k', 'int', 3]]);
    });

    it('folds string expressions in defaults, titles, groups and options', () => {
        expect(declared('s = input.string("a" + "b")', 'plot(str.length(s))')).toEqual([['in_0', 's', 'string', 'ab']]);
        expect(declared('s = input.string(str.upper("abc"))', 'plot(str.length(s))')).toEqual([['in_0', 's', 'string', 'ABC']]);
        expect(declared('s = input.session("0930" + "-1600")', 'plot(close)')).toEqual([['in_0', 's', 'session', '0930-1600']]);
        expect(declared('k = input.int(3, "T" + "x")', 'plot(k)')).toEqual([['in_0', 'Tx', 'int', 3]]);
        const meta = new Indicator(pine('k = input.int(2, group = "G" + "1", options = [1, 1 + 1, 3])', 'plot(k)')).getInputsMeta()[0];
        expect(meta.group).toBe('G1');
        expect(meta.options).toEqual([1, 2, 3]);
    });

    it('folds int arguments of input.int', () => {
        const meta = new Indicator(pine('k = input.int(int(10 / 3), "K", minval = 1 + 1, maxval = 10 * 10)', 'plot(k)')).getInputsMeta()[0];
        expect([meta.name, meta.defval, meta.minval, meta.maxval]).toEqual(['K', 3, 2, 100]);
    });

    it('folds timestamp() in input.time defaults', () => {
        expect(declared('t = input.time(timestamp("2024-01-01 00:00 +0000"))', 'plot(t)')).toEqual([['in_0', 't', 'time', 1704067200000]]);
        expect(declared('t = input.time(timestamp("2024-01-01 00:00 +0000") + 3600000)', 'plot(t)')).toEqual([['in_0', 't', 'time', 1704070800000]]);
        expect(declared('k = input(timestamp("2024-01-01 00:00 +0000"))', 'plot(k)')).toEqual([['in_0', 'k', 'int', 1704067200000]]);
    });

    it('folds color constructors', () => {
        expect(declared('c = input.color(color.new(color.red, 50))', 'plot(close, color = c)')).toEqual([['in_0', 'c', 'color', '#F2364580']]);
        expect(declared('c = input(color.rgb(255, 0, 0))', 'plot(close, color = c)')).toEqual([['in_0', 'c', 'color', '#FF0000FF']]);
    });
});

describe('input declarations: runtime values and overrides', () => {
    it('a local input keeps the value assigned when its block ran', async () => {
        const src = pine('var k = 0', 'if barstate.isfirst', '    k := input(14)', ...plotted(['k']));
        expect(await firstValues(new Indicator(src), ['k'])).toEqual({ k: [14, 14, 14] });
        expect(await firstValues(new Indicator(src, { in_0: 20 }), ['k'])).toEqual({ k: [20, 20, 20] });
        const ind = new Indicator(src);
        ind.input['k'] = 20;
        expect(await firstValues(ind, ['k'])).toEqual({ k: [20, 20, 20] });
    });

    it('a local input whose block never runs leaves the variable untouched', async () => {
        const src = pine('var k = 0', 'if close < 0', '    k := input(14)', ...plotted(['k']));
        expect(await firstValues(new Indicator(src), ['k'])).toEqual({ k: [0, 0, 0] });
    });

    it('an input nested in an assigned expression is overridable by the variable name or its id', async () => {
        const src = pine('v = ta.sma(bar_index, input(14))', 'w = ta.sma(bar_index, 3)', ...plotted(['v', 'w']));
        expect(await firstValues(new Indicator(src, { in_0: 3 }), ['v', 'w'])).toEqual({ v: [NaN, NaN, 1], w: [NaN, NaN, 1] });

        const ind = new Indicator(src);
        expect(Object.keys(ind.input)).toEqual(['v']);
        ind.input['v'] = 3;
        expect(await firstValues(ind, ['v'])).toEqual({ v: [NaN, NaN, 1] });
    });

    it('an untitled argument input is overridable by its id', async () => {
        const src = pine('plot(ta.sma(bar_index, input(14)), "v")');
        const ind = new Indicator(src);
        expect(Object.keys(ind.input)).toEqual(['in_0']);
        expect(await firstValues(ind, ['v'], 14)).toEqual({ v: [...Array(13).fill(NaN), 6.5] });
        ind.input['in_0'] = 3;
        expect(await firstValues(ind, ['v'])).toEqual({ v: [NaN, NaN, 1] });
    });

    it('inputs sharing a variable name are overridden independently', async () => {
        const src = pine('m = bar_index % 2 == 0 ? "a" : "b"', 'k = switch m', '    "a" => input(10)', '    => input(20)', ...plotted(['k']));
        expect(await firstValues(new Indicator(src, { in_1: 5 }), ['k'])).toEqual({ k: [10, 5, 10] });

        const ind = new Indicator(src);
        expect(Object.keys(ind.input)).toEqual(['k', 'in_1']);
        ind.input['k'] = 7;
        expect(await firstValues(ind, ['k'])).toEqual({ k: [7, 20, 7] });
        ind.input['in_1'] = 5;
        expect(await firstValues(ind, ['k'])).toEqual({ k: [7, 5, 7] });
    });

    it('an input inside a function called twice is a single input', async () => {
        const src = pine('f() => input(14)', 'k = f() + f()', ...plotted(['k']));
        expect(await firstValues(new Indicator(src), ['k'])).toEqual({ k: [28, 28, 28] });
        expect(await firstValues(new Indicator(src, { in_0: 1 }), ['k'])).toEqual({ k: [2, 2, 2] });
    });

    it('runtime values match the folded defaults', async () => {
        const src = pine(
            'k = input(7 / 2)',
            'p = 7 / 2',
            't = input.time(timestamp("2024-01-01 00:00 +0000") + 3600000)',
            'n = 0',
            'for i = 0 to 2',
            '    y = 4',
            '    n += input(y)',
            'c = true ? input(1) : input(2)',
            ...plotted(['k', 'p', 't', 'n', 'c']),
        );
        expect(await firstValues(new Indicator(src), ['k', 'p', 't', 'n', 'c'])).toEqual({
            k: [3, 3, 3],
            p: [3.5, 3.5, 3.5],
            t: [1704070800000, 1704070800000, 1704070800000],
            n: [12, 12, 12],
            c: [1, 1, 1],
        });
    });

    it('input.timeframe honours overrides', async () => {
        const src = pine('tf = input.timeframe("D", "TF")', 'plot(tf == "60" ? 1 : 0, "x")');
        expect(await firstValues(new Indicator(src), ['x'])).toEqual({ x: [0, 0, 0] });
        expect(await firstValues(new Indicator(src, { TF: '60' }), ['x'])).toEqual({ x: [1, 1, 1] });
    });
});

describe('input declarations: compile errors', () => {
    const fails = (lines: string[], message: string) => expect(() => transpile(pine(...lines))).toThrow(message);

    it('a loop counter is an undeclared identifier inside input arguments', () => {
        fails(['for i = 0 to 9', '    k = input(i)', 'plot(na)'], 'Undeclared identifier "i" at 4:15');
        fails(['for i = 0 to 9', '    k = input(i + 1)', 'plot(na)'], 'Undeclared identifier "i" at 4:15');
        fails(['arr = array.from(1, 2)', 'for v in arr', '    k = input(v)', 'plot(na)'], 'Undeclared identifier "v" at 5:15');
        fails(['i = 3', 'var float r = na', 'for i = 0 to 2', '    r := input(i)', 'plot(r)'], 'Undeclared identifier "i" at 6:16');
    });

    it('a function parameter is an undeclared identifier inside input arguments', () => {
        fails(['f(x) => input(x)', 'plot(f(3))'], 'Undeclared identifier "x" at 3:15');
        fails(['x = 7', 'f(x) => input(x)', 'plot(f(1))'], 'Undeclared identifier "x" at 4:15');
        fails(['f(s) => input(1, s)', 'plot(f("a"))'], 'Undeclared identifier "s" at 3:18');
    });

    it('an input argument cannot reference another input', () => {
        fails(
            ['a = input(5)', 'b = input(a)', 'plot(b)'],
            'Arguments of input function must be of constant type, or "source" builtin variables. at 4:5',
        );
    });

    it('a function parameter default cannot be a function call', () => {
        const msg = 'The default value cannot be a function, variable or calculation.';
        fails(['f(a = input(14), b = input(28)) => ta.sma(close, a) - ta.sma(close, b)', 'plot(f())'], `${msg} at 3:3`);
        fails(['f(a = 1, b = input(28)) => a + b', 'plot(f())'], `${msg} at 3:10`);
        fails(['f(a = input.int(14)) => a', 'plot(f())'], `${msg} at 3:3`);
        fails(['f(a = math.max(1, 2)) => a', 'plot(f())'], `${msg} at 3:3`);
        fails(['method m(float x, int n = input(3)) => x + n', 'plot(close.m())'], `${msg} at 3:19`);
    });

    it('a function parameter default cannot be a calculation', () => {
        fails(
            ['f(a = 2 + 2) => a', 'plot(f())'],
            'The default value assigned to a parameter must be either a literal value (e.g., "5") or a built-in variable (e.g., "close"). at 3:3',
        );
    });

    it('literal and built-in parameter defaults are accepted', () => {
        for (const def of ['a = -1', 'a = "x"', 'a = true', 'a = close', 'a = math.pi', 'color a = color.red']) {
            expect(() => transpile(pine(`f(${def}) => a`, 'plot(close)'))).not.toThrow();
        }
    });
});
