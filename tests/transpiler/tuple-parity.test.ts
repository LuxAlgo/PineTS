// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Tuple parity with TradingView: returning tuples from local scopes,
 * declaring them, and passing them to request.security / request.security_lower_tf.
 * Reference: https://www.tradingview.com/pine-script-docs/language/type-system/#tuples
 *
 * Every expected value and accept/reject verdict below comes from running the
 * same script on TradingView (BINANCE:BTCUSDT, Sep 2026). The
 * scripts only depend on `bar_index`, so the values are feed-independent.
 */

import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';
import { pineToJS } from '../../src/transpiler/pineToJS/pineToJS.index';

const HEADER = ['//@version=6', 'indicator("tuple parity")'];

async function plotValues(lines: string[], names: string[], timeframe: string, end: string): Promise<Record<string, number[]>> {
    const plots = names.map((n) => `plot(${n}, "${n}")`);
    const source = [...HEADER, ...lines, ...plots].join('\n') + '\n';
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', timeframe, undefined, new Date('2024-01-01').getTime(), new Date(end).getTime());
    const { plots: out } = await pineTS.run(source);
    return Object.fromEntries(names.map((n) => [n, out[n].data.map((d: any) => d.value)]));
}

// First five bars (bar_index 0..4) of each named plot.
async function firstValues(lines: string[], names: string[]): Promise<Record<string, number[]>> {
    const all = await plotValues(lines, names, '60', '2024-01-03');
    return Object.fromEntries(Object.entries(all).map(([n, v]) => [n, v.slice(0, 5)]));
}

function transpileError(lines: string[]): string {
    const r: { success: boolean; error?: string } = pineToJS([...HEADER, ...lines].join('\n') + '\n');
    expect(r.success).toBe(false);
    return r.error as string;
}

describe('Tuples returned by functions', () => {
    it('a switch statement followed by the tuple return (reported)', async () => {
        expect(
            await firstValues(
                [
                    'f(a) =>',
                    '    uV = 0.0',
                    '    dV = 0.0',
                    '    switch',
                    '        a > 0 => uV += a',
                    '        a < 0 => dV -= a',
                    '    [uV, dV]',
                    '[u, d] = f(bar_index - 2)',
                ],
                ['u', 'd']
            )
        ).toEqual({ u: [0, 0, 0, 1, 2], d: [2, 1, 0, 0, 0] });
    });

    it('a switch whose arms return tuples', async () => {
        expect(
            await firstValues(['f(a) =>', '    switch', '        a > 2 => [a, 1]', '        => [0, a]', '[u, d] = f(bar_index)'], ['u', 'd'])
        ).toEqual({ u: [0, 0, 0, 3, 4], d: [0, 1, 2, 1, 1] });
    });

    it('an if without else returns na for every tuple item when the condition is false', async () => {
        expect(await firstValues(['f(a) =>', '    if a > 2', '        [a, a * 2]', '[u, d] = f(bar_index)'], ['u', 'd'])).toEqual({
            u: [NaN, NaN, NaN, 3, 4],
            d: [NaN, NaN, NaN, 6, 8],
        });
    });

    it('a tuple declared from an if / else if / else expression inside the function', async () => {
        expect(
            await firstValues(
                [
                    'f(a) =>',
                    '    [x, y] = if a > 2',
                    '        [a, 1]',
                    '    else if a > 0',
                    '        [1, a]',
                    '    else',
                    '        [0, 0]',
                    '    [x + y, x - y]',
                    '[u, d] = f(bar_index)',
                ],
                ['u', 'd']
            )
        ).toEqual({ u: [0, 2, 3, 4, 5], d: [0, 0, -1, 2, 3] });
    });

    it('a function returning the tuple of another function whose switch arms return tuples', async () => {
        expect(
            await firstValues(
                ['f(a) =>', '    switch', '        a > 2 => [a, 1]', '        => [0, a]', 'g(a) => f(a * 2)', '[u, d] = g(bar_index)'],
                ['u', 'd']
            )
        ).toEqual({ u: [0, 0, 4, 6, 8], d: [0, 2, 1, 1, 1] });
    });

    it('a function whose last statement is a for loop yielding tuples', async () => {
        expect(await firstValues(['f(a) =>', '    for i = 0 to a', '        [i, i * 5]', '[u, d] = f(bar_index)'], ['u', 'd'])).toEqual({
            u: [0, 1, 2, 3, 4],
            d: [0, 5, 10, 15, 20],
        });
    });

    it('a user-defined method returning a tuple', async () => {
        expect(await firstValues(['method m(int x) =>', '    [x, x * 2]', 'n = bar_index', '[u, d] = n.m()'], ['u', 'd'])).toEqual({
            u: [0, 1, 2, 3, 4],
            d: [0, 2, 4, 6, 8],
        });
    });
});

describe('Tuples returned by conditional structures and loops', () => {
    it('if / else expression (docs example)', async () => {
        expect(await firstValues(['[v1, v2] = if bar_index % 2 == 0', '    [bar_index, 1]', 'else', '    [2, bar_index]'], ['v1', 'v2'])).toEqual({
            v1: [0, 2, 2, 2, 4],
            v2: [1, 1, 1, 3, 1],
        });
    });

    it('if expression without else yields na items on the bars where it does not run', async () => {
        expect(await firstValues(['[v1, v2] = if bar_index % 2 == 0', '    [bar_index, 1]'], ['v1', 'v2'])).toEqual({
            v1: [0, NaN, 2, NaN, 4],
            v2: [1, NaN, 1, NaN, 1],
        });
    });

    it('for loop returns the tuple of its last iteration', async () => {
        expect(await firstValues(['[v1, v2] = for i = 0 to bar_index', '    [i, i * 2]'], ['v1', 'v2'])).toEqual({
            v1: [0, 1, 2, 3, 4],
            v2: [0, 2, 4, 6, 8],
        });
    });

    it('while loop returns the tuple of its last iteration, na when it never runs', async () => {
        expect(await firstValues(['i = 0', '[v1, v2] = while i < bar_index', '    i += 1', '    [i, i * 3]'], ['v1', 'v2'])).toEqual({
            v1: [NaN, 1, 2, 3, 4],
            v2: [NaN, 3, 6, 9, 12],
        });
    });
});

describe('Tuples passed to request.security', () => {
    it('the reported switch-statement function as the expression', async () => {
        expect(
            await firstValues(
                [
                    'f(a) =>',
                    '    uV = 0.0',
                    '    dV = 0.0',
                    '    switch',
                    '        a > 0 => uV += a',
                    '        a < 0 => dV -= a',
                    '    [uV, dV]',
                    '[u, d] = request.security(syminfo.tickerid, timeframe.period, f(bar_index - 2))',
                ],
                ['u', 'd']
            )
        ).toEqual({ u: [0, 0, 0, 1, 2], d: [2, 1, 0, 0, 0] });
    });

    it('a function whose switch arms return tuples as the expression', async () => {
        expect(
            await firstValues(
                [
                    'f(a) =>',
                    '    switch',
                    '        a > 2 => [a, 1]',
                    '        => [0, a]',
                    '[u, d] = request.security(syminfo.tickerid, timeframe.period, f(bar_index))',
                ],
                ['u', 'd']
            )
        ).toEqual({ u: [0, 0, 0, 3, 4], d: [0, 1, 2, 1, 1] });
    });

    it('a function whose if without else returns a tuple, na on the bars where it does not run', async () => {
        expect(
            await firstValues(
                ['f(a) =>', '    if a > 2', '        [a, a * 2]', '[u, d] = request.security(syminfo.tickerid, timeframe.period, f(bar_index))'],
                ['u', 'd']
            )
        ).toEqual({ u: [NaN, NaN, NaN, 3, 4], d: [NaN, NaN, NaN, 6, 8] });
    });

    it('a tuple through the named expression argument', async () => {
        expect(
            await firstValues(['[a, b] = request.security(syminfo.tickerid, timeframe.period, expression = [bar_index, bar_index * 3])'], ['a', 'b'])
        ).toEqual({ a: [0, 1, 2, 3, 4], b: [0, 3, 6, 9, 12] });
    });

    // TradingView: every item of a higher-timeframe tuple equals the same series requested alone.
    it('higher-timeframe tuple items equal the scalar requests, from a function returning a tuple', async () => {
        const v = await plotValues(
            [
                'eq(x, y) => (na(x) and na(y)) or x == y ? 1 : 0',
                'f(a) =>',
                '    uV = 0.0',
                '    dV = 0.0',
                '    switch',
                '        a > 0 => uV += a',
                '        a < 0 => dV -= a',
                '    [uV, dV]',
                '[u, d] = request.security(syminfo.tickerid, "D", f(close - open))',
                'u2 = request.security(syminfo.tickerid, "D", math.max(close - open, 0))',
                'd2 = request.security(syminfo.tickerid, "D", math.max(open - close, 0))',
                '[c, b] = request.security(syminfo.tickerid, "D", [close[1], bar_index])',
                'c2 = request.security(syminfo.tickerid, "D", close[1])',
                'b2 = request.security(syminfo.tickerid, "D", bar_index)',
                'eu = eq(u, u2)',
                'ed = eq(d, d2)',
                'ec = eq(c, c2)',
                'eb = eq(b, b2)',
            ],
            ['eu', 'ed', 'ec', 'eb'],
            '60',
            '2024-01-10'
        );
        for (const series of Object.values(v)) expect(new Set(series)).toEqual(new Set([1]));
    });
});

describe('Tuples passed to request.security_lower_tf', () => {
    // TradingView: tuple items equal the scalar requests; a daily BINANCE:BTCUSDT bar holds 24 hourly intrabars.
    it('a function whose switch arms return tuples yields the same intrabar arrays as the scalar requests', async () => {
        const v = await plotValues(
            [
                'arrEq(array<float> x, array<float> y) =>',
                '    bool r = x.size() == y.size()',
                '    if r',
                '        for [i, e] in x',
                '            if e != y.get(i)',
                '                r := false',
                '    r ? 1 : 0',
                'f() =>',
                '    switch',
                '        close > open => [close, 1.0]',
                '        => [open, 0.0]',
                '[vs, ks] = request.security_lower_tf(syminfo.tickerid, "60", f())',
                'vs2 = request.security_lower_tf(syminfo.tickerid, "60", close > open ? close : open)',
                'ks2 = request.security_lower_tf(syminfo.tickerid, "60", close > open ? 1.0 : 0.0)',
                'ev = arrEq(vs, vs2)',
                'ek = arrEq(ks, ks2)',
                'n = vs.size()',
            ],
            ['ev', 'ek', 'n'],
            'D',
            '2024-02-01'
        );
        expect(new Set(v.ev)).toEqual(new Set([1]));
        expect(new Set(v.ek)).toEqual(new Set([1]));
        expect(new Set(v.n)).toEqual(new Set([24]));
    });
});

describe('Line wrapping inside an argument list', () => {
    it('a history reference wrapped onto its own line applies to the call before it', async () => {
        expect(await firstValues(['f(a) => a * 10', 'v = math.max(f(bar_index)', '      [1], 0)'], ['v'])).toEqual({ v: [NaN, 0, 10, 20, 30] });
    });
});

describe('Tuple forms TradingView rejects (same message and position)', () => {
    it('a ternary returning tuples', () => {
        expect(transpileError(['[v1, v2] = bar_index > 2 ? [bar_index, 1] : [1, bar_index]'])).toBe(
            'Ternary operations cannot return tuples. Convert the expression into an `if` or `switch` conditional structure to return a tuple. at 3:28'
        );
    });

    it('type keywords in a tuple declaration', () => {
        expect(transpileError(['f(a) => [a, a * 2]', '[int u, int d] = f(bar_index)'])).toBe('Mismatched input "u" expecting set "]" at 4:6');
    });

    it('more or fewer names than the function returns', () => {
        const msg = (right: number, left: number) =>
            `Syntax error: The quantities of tuple elements on each side of the assignment operator do not match. The right side has ${right} but the left side has ${left}. at 4:1`;
        expect(transpileError(['f(a) => [a, a * 2]', '[u, d, e] = f(bar_index)'])).toBe(msg(2, 3));
        expect(transpileError(['f(a) => [a, a * 2]', '[u] = f(bar_index)'])).toBe(msg(2, 1));
        expect(transpileError(['f(a) => [a, a * 2]', 'g(a) => f(a)', '[u, d, e] = g(bar_index)'])).toBe(msg(2, 3).replace('at 4:1', 'at 5:1'));
    });

    it('reassigning a tuple with :=', () => {
        expect(transpileError(['f(a) => [a, a * 2]', 'u = 0', 'd = 0', '[u, d] := f(bar_index)'])).toBe('Mismatched input ":=" expecting set "=" at 6:8');
    });

    it('the same name twice', () => {
        expect(transpileError(['f(a) => [a, a * 2]', '[u, u] = f(bar_index)'])).toBe('"u" is already defined at 4:1');
    });

    it('a tuple-returning call assigned to a single variable', () => {
        expect(transpileError(['f(a) => [a, a * 2]', 'u = f(bar_index)'])).toBe('Invalid assignment. Cannot assign a tuple to a variable "u". at 4:1');
    });

    it('a bare tuple literal outside a local block', () => {
        expect(transpileError(['u = [bar_index, 1]'])).toBe('Syntax error at input "[" at 3:5');
        expect(transpileError(['[u, d] = [bar_index, bar_index * 2]'])).toBe('Syntax error at input "[" at 3:10');
    });

    it('a tuple passed to a user-defined function', () => {
        expect(transpileError(['f(x) => x', 'u = f([bar_index, 1])'])).toBe(
            'The "x" parameter of the "f()" function cannot accept a tuple as an argument. Pass a single argument to this parameter. at 4:5'
        );
        expect(transpileError(['f(x, y) => x + y', 'u = f(1, y = [bar_index, 1])'])).toBe(
            'The "y" parameter of the "f()" function cannot accept a tuple as an argument. Pass a single argument to this parameter. at 4:5'
        );
    });

    it('a tuple passed to a built-in other than request.*() / input.*()', () => {
        expect(transpileError(['u = math.max([bar_index, 1])'])).toMatch(/^Cannot call "math\.max" with a tuple argument\..* at 3:14$/);
    });

    it('underscores may repeat', async () => {
        expect(await firstValues(['f(a) => [a, a * 2, a * 3]', '[_, m, _] = f(bar_index)'], ['m'])).toEqual({ m: [0, 2, 4, 6, 8] });
    });
});
