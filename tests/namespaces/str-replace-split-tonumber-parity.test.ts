import { describe, expect, it } from 'vitest';
import { Str } from '../../src/namespaces/Str';

// Every expectation is TradingView's result for the same call.
const str = new Str({} as any);

describe('str.replace occurrences', () => {
    it('counts overlapping occurrences', () => {
        expect(str.replace('aaaa', 'aa', 'b', 1)).toBe('aba');
        expect(str.replace_all('aaa', 'aa', 'b')).toBe('ba');
    });

    it('inserts at the start for an empty target', () => {
        expect(str.replace('abc', '', 'X', 0)).toBe('Xabc');
        expect(str.replace_all('ab', '', '-')).toBe('-a-b-');
    });

    it('treats the target literally', () => {
        expect(str.replace_all('a.b.c', '.', '-')).toBe('a-b-c');
        expect(str.replace('x$y', '$', 'S', 0)).toBe('xSy');
        expect(str.replace_all('aa', 'a', '$0')).toBe('$0$0');
        expect(str.replace('a-b', '-', '_', 5)).toBe('a-b');
    });
});

describe('str.split', () => {
    it('gives one empty element for an empty source and separator', () => {
        expect(str.split('', '').array).toEqual(['']);
        expect(str.split('abc', '').array).toEqual(['a', 'b', 'c']);
        expect(str.split('a.b.c', '.').array).toHaveLength(3);
    });
});

describe('str.tonumber', () => {
    it('reads a run of digits and dots up to its second dot', () => {
        expect(str.tonumber('1.2.3')).toBe(1.2);
        expect(str.tonumber('1.2.3.4')).toBe(1.2);
        expect(str.tonumber('1..2')).toBe(1);
        expect(str.tonumber('3.14.15')).toBe(3.14);
        expect(str.tonumber('.5.5')).toBe(0.5);
        expect(str.tonumber('-1.2.3')).toBe(-1.2);
        expect(str.tonumber('1.2.')).toBe(1.2);
    });

    it('still rejects other characters and exponents', () => {
        for (const s of ['12abc', '1.2x', '1-2', '1 2', '1.2e', '1.5e3', '1e3', '5e', '--5', '1,000', 'Infinity', 'NaN']) {
            expect(Number.isNaN(str.tonumber(s)), s).toBe(true);
        }
        expect(str.tonumber('+5')).toBe(5);
        expect(str.tonumber('007')).toBe(7);
        expect(str.tonumber('5.')).toBe(5);
    });
});
