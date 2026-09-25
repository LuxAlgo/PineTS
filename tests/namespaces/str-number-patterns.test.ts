// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Number patterns of str.tostring() and str.format(). Every expected string was produced
 * by TradingView. The two functions differ: str.tostring rounds half up and prints a value
 * that rounds to zero without its sign; str.format rounds half even and keeps the sign, and
 * formats plain {N} numbers with "#,##0.###".
 */

import { describe, it, expect } from 'vitest';
import PineTS from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

async function lastValues(source: (context: any) => Record<string, string>) {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2019-01-01').getTime(), new Date('2019-01-02').getTime());
    const { result } = await pineTS.run(source);
    return Object.fromEntries(Object.entries(result).map(([k, v]: [string, any]) => [k, v[v.length - 1]]));
}

describe('str.tostring number patterns', () => {
    it('zero-pads, keeps literal text, groups digits and treats # as optional', async () => {
        const r = await lastValues((context: any) => {
            const { str } = context.pine;
            return {
                a: str.tostring(8, '00'),
                b: str.tostring(1, '    #.0'),
                c: str.tostring(0.5, '#.##'),
                d: str.tostring(-0.5, '#.#'),
                e: str.tostring(0.4, '#'),
                f: str.tostring(0.5, '#.00'),
                g: str.tostring(999, '#,###'),
                h: str.tostring(0.1234, '#.##%'),
                i: str.tostring(0.5, '0.0%'),
                j: str.tostring(-1234.567, '#,##0.0'),
                k: str.tostring(12, '$#'),
                l: str.tostring(1e7, '#'),
                m: str.tostring(7, '0 bars'),
                n: str.tostring(3.14159, '#.####'),
                o: str.tostring(2, '#.#'),
            };
        });
        expect(r).toEqual({
            a: '08', b: '    1.0', c: '0.5', d: '-0.5', e: '0', f: '.50', g: '999', h: '12.34%', i: '50.0%',
            j: '-1,234.6', k: '$12', l: '10000000', m: '7 bars', n: '3.1416', o: '2',
        });
    });

    it('rounds half up and drops the sign of a value that rounds to zero', async () => {
        const r = await lastValues((context: any) => {
            const { str } = context.pine;
            return {
                a: str.tostring(2.5, '#'),
                b: str.tostring(3.5, '#'),
                c: str.tostring(5.25, '000.0'),
                d: str.tostring(1.25, '#.#'),
                e: str.tostring(0.125, '0.00'),
                f: str.tostring(0.375, '0.00'),
                g: str.tostring(0.135, '0.00'),
                h: str.tostring(-0.04, '0.0'),
                i: str.tostring(-0.0001, '0.00'),
                j: str.tostring(-0.0001, '#.##'),
            };
        });
        expect(r).toEqual({ a: '3', b: '4', c: '005.3', d: '1.3', e: '0.13', f: '0.38', g: '0.14', h: '0.0', i: '0.00', j: '0' });
    });

    it('pads the shortest decimal representation for long patterns', async () => {
        const r = await lastValues((context: any) => {
            const { str } = context.pine;
            // math.pi, math.e, math.phi
            return {
                a: str.tostring(3.141592653589793, '0.0000000000000000'),
                b: str.tostring(2.718281828459045, '0.0000000000000000'),
                c: str.tostring(1.618033988749895, '0.0000000000000000'),
                d: str.format('{0,number,0.0000000000000000}', 3.141592653589793),
                e: str.tostring(123456.789, '0.000000000000'),
            };
        });
        expect(r).toEqual({ a: '3.1415926535897930', b: '2.7182818284590450', c: '1.6180339887498950', d: '3.1415926535897930', e: '123456.789000000000' });
    });
});

describe('str.format number patterns', () => {
    it('applies {N,number,<pattern>} like TradingView', async () => {
        const r = await lastValues((context: any) => {
            const { str } = context.pine;
            return {
                a: str.format('{0,number,00}', 8),
                b: str.format('{0,number,0000}', 830),
                c: str.format('{0,number,00}{1,number,00}', 8, 30),
                d: str.format('{0,number,    #.0}', 1),
                e: str.format('{0,number,    #.0}', 2.618),
                f: str.format('{0,number,#.##}', 1.005),
                g: str.format('{0,number,#.##}', 3),
                h: str.format('{0,number,0.00}', 3),
                i: str.format('{0,number,#,###}', 1234567),
                j: str.format('{0,number,#,##0.00}', 1234.5),
                k: str.format('{0,number,x#.#x}', 1.25),
                l: str.format('{0,number,00.00}', -3.14159),
            };
        });
        expect(r).toEqual({
            a: '08', b: '0830', c: '0830', d: '    1.0', e: '    2.6', f: '1', g: '3', h: '3.00',
            i: '1,234,567', j: '1,234.50', k: 'x1.2x', l: '-03.14',
        });
    });

    it('rounds half even and keeps the sign of a value that rounds to zero', async () => {
        const r = await lastValues((context: any) => {
            const { str } = context.pine;
            return {
                a: str.format('{0,number,#}', 2.5),
                b: str.format('{0,number,#}', 3.5),
                c: str.format('{0,number,000.0}', 5.25),
                d: str.format('{0,number,#.#}', 1.25),
                e: str.format('{0,number,0.00}', 0.125),
                f: str.format('{0,number,0.00}', 0.375),
                g: str.format('{0,number,0.0}', -0.04),
                h: str.format('{0,number,#.##}', -0.0001),
                i: str.format('{0,number,#.##}', 0.5),
                j: str.format('{0,number,#.00}', 0.5),
            };
        });
        expect(r).toEqual({ a: '2', b: '4', c: '005.2', d: '1.2', e: '0.12', f: '0.38', g: '-0.0', h: '-0', i: '0.5', j: '.50' });
    });

    it('formats plain and named {N,number} placeholders', async () => {
        const r = await lastValues((context: any) => {
            const { str } = context.pine;
            return {
                a: str.format('{0}|{1}|{2}|{3}|{4}|{5}|{6}|{7}|{8}', 1000, 3.14159, 1234567.891, -0.5, 0.00001, 2.5, 1234.5678, -1234567, 0.0005),
                b: str.format('{0}|{1}|{2}|{3}|{4}', NaN, true, 'text', 100.0, 1e21),
                c: str.format('{0,number}|{1,number,integer}|{2,number,percent}|{3,number,currency}', 1234.5678, 1234.5678, 0.1234, 1234.5),
            };
        });
        expect(r).toEqual({
            a: '1,000|3.142|1,234,567.891|-0.5|0|2.5|1,234.568|-1,234,567|0',
            b: 'NaN|true|text|100|1,000,000,000,000,000,000,000',
            c: '1,234.568|1,235|12%|$1,234.50',
        });
    });
});
