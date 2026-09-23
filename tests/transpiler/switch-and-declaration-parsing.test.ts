// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Pine scripts that failed to transpile, or transpiled into the wrong program:
 *   - a switch arm ending in a call, followed by the default `=>` arm
 *   - multi-line switch arms that each declare a local with the same name
 *   - `var const` / `varip const` declarations
 *   - a variable declared before a user function with the same name
 *
 * Expected values are computed by hand from the Pine semantics. The scripts only
 * depend on `bar_index`, so the values are feed-independent.
 */

import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

const HEADER = ['//@version=6', 'indicator("switch and declaration parsing")'];

// First five bars (bar_index 0..4) of each named plot.
async function firstValues(lines: string[], names: string[]): Promise<Record<string, number[]>> {
    const plots = names.map((n) => `plot(${n}, "${n}")`);
    const source = [...HEADER, ...lines, ...plots].join('\n') + '\n';
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', undefined, new Date('2024-01-01').getTime(), new Date('2024-01-03').getTime());
    const { plots: out } = await pineTS.run(source);
    return Object.fromEntries(names.map((n) => [n, out[n].data.slice(0, 5).map((d: any) => d.value)]));
}

describe('switch: an arm ending in a call, followed by the default arm', () => {
    it('call arguments with a dotted name, a string and a nested call', async () => {
        expect(
            await firstValues(
                [
                    'g(x) => str.length(x)',
                    's = bar_index % 2 == 0 ? "a" : "b"',
                    'float dotted = switch s',
                    '    "a" => nz(bar_index, syminfo.mintick)',
                    '    => bar_index * 10',
                    'float literal = switch s',
                    '    "a" => g("abc")',
                    '    => bar_index * 10',
                    'float nested = switch s',
                    '    "a" => nz(math.abs(-bar_index))',
                    '    => bar_index * 10',
                ],
                ['dotted', 'literal', 'nested']
            )
        ).toEqual({
            dotted: [0, 10, 2, 30, 4],
            literal: [3, 10, 3, 30, 3],
            nested: [0, 10, 2, 30, 4],
        });
    });

    it('plain identifier arguments are a call, not a function declaration', async () => {
        expect(
            await firstValues(
                ['s = bar_index % 2 == 0 ? "a" : "b"', 'x = bar_index + 100', 'float v = switch s', '    "a" => nz(x)', '    => bar_index * 10'],
                ['v']
            )
        ).toEqual({ v: [100, 10, 102, 30, 104] });
    });

    it('a switch returned from a function', async () => {
        expect(
            await firstValues(['f(src) =>', '    switch bar_index % 2', '        0 => nz(math.max(src, 1))', '        => src * 10', 'v = f(bar_index)'], ['v'])
        ).toEqual({ v: [1, 10, 2, 30, 4] });
    });
});

describe('switch: multi-line arms', () => {
    it('each arm may declare a local with the same name', async () => {
        expect(
            await firstValues(
                [
                    'f(src) =>',
                    '    switch bar_index % 3',
                    '        0 =>',
                    '            float e = src + 1',
                    '            e',
                    '        1 =>',
                    '            float e = src * 2',
                    '            e',
                    '        =>',
                    '            float e = src * 3',
                    '            e',
                    'v = f(bar_index)',
                ],
                ['v']
            )
        ).toEqual({ v: [1, 2, 6, 4, 8] });
    });
});

describe('var / varip with a type qualifier', () => {
    it('var const and varip const declarations', async () => {
        expect(
            await firstValues(
                ['var const float K = 5', 'varip const int J = 3', 'var const color C = color.new(color.gray, 100)', 'v = K + J + bar_index'],
                ['v']
            )
        ).toEqual({ v: [8, 9, 10, 11, 12] });
    });
});

describe('a variable and a user function with the same name', () => {
    it('variable declared before the function', async () => {
        expect(await firstValues(['res = bar_index * 3', 'res() => 100', 'v = res + res()'], ['res', 'v'])).toEqual({
            res: [0, 3, 6, 9, 12],
            v: [100, 103, 106, 109, 112],
        });
    });

    it('typed variable declared before the function', async () => {
        expect(await firstValues(['int cnt = bar_index', 'cnt(x) => x * 2', 'v = cnt + cnt(cnt)'], ['v'])).toEqual({ v: [0, 3, 6, 9, 12] });
    });

    it('function declared before the variable', async () => {
        expect(await firstValues(['res() => 100', 'res = bar_index * 3', 'v = res + res()'], ['v'])).toEqual({ v: [100, 103, 106, 109, 112] });
    });
});
