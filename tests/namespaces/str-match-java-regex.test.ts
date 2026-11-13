import { describe, expect, it } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';
import { Str } from '../../src/namespaces/Str';
import { PineRuntimeError } from '../../src/errors/PineRuntimeError';

// Every expectation below is TradingView's output for the same str.match call.
// TradingView's na string is the empty string, so "no match" is "".
const str = new Str({} as any);

describe('str.match uses the Java regex flavor', () => {
    it.each([
        ['abc', '^abc$', 'abc'],
        ['xabc', '^abc', ''],
        ['cat_dog', 'dog|bird', 'dog'],
        ['a12b34b', 'a.*b', 'a12b34b'],
        ['a12b34b', 'a.*?b', 'a12b'],
        ['abc123', '[^0-9]+', 'abc'],
        ['ab-cd', '\\w+$', 'cd'],
        ['cat-category', '\\bcat\\b', 'cat'],
        ['a.b_axb', 'a\\.b', 'a.b'],
        ['axb', 'a.b', 'axb'],
        ['abcabcx', '(abc)+', 'abcabc'],
        ['aaaa', 'a{2,3}', 'aaa'],
        ['HeLLo', '(?i)hello', 'HeLLo'],
        ['foo123', 'foo(?=\\d)', 'foo'],
        ['color', 'colou?r', 'color'],
        ['abc', '', ''],
        ['aaa', 'a*?', ''],
        ['abc', '$', ''],
    ])('common syntax: str.match(%j, %j) == %j', (source, pattern, expected) => {
        expect(str.match(source, pattern)).toBe(expected);
    });

    it.each([
        ['aaa', 'a*+a', ''],
        ['aaa', 'a*a', 'aaa'],
        ['aaa', '(?>a*)a', ''],
        ['hello', '[a-z&&[aeiou]]+', 'e'],
        ['hello', '[a-z&&[^aeiou]]+', 'h'],
        ['abCDef', '\\p{Lu}+', 'CD'],
        ['1héllo2', '\\p{L}+', 'héllo'],
        ['ababx', '(ab)\\1', 'abab'],
        ['caab', '(?<x>a+)b', 'aab'],
        ['x123', '(?<=x)\\d+', '123'],
        ['a.b', '\\Q.\\E', '.'],
        ['abc', '\\Aab', 'ab'],
        ['ab12', '\\d+\\z', '12'],
        ['a\nb', 'a.b', ''],
        ['a\nb', '(?s)a.b', 'a\nb'],
        ['a\nb', '(?m)^b', 'b'],
        ['ABc', '\\u0041', 'A'],
        ['ABc', '\\x42', 'B'],
    ])('Java-only syntax: str.match(%j, %j) == %j', (source, pattern, expected) => {
        expect(str.match(source, pattern)).toBe(expected);
    });

    it.each([
        ['\\d+', '2024'],
        ['[A-Z]+', 'BTCUSDC'],
        ['\\d{4}', '2024'],
        ['(BTC|ETH)', 'BTC'],
        ['\\d+(\\.\\d+)?', '2024'],
        ['USDC?', 'USDC'],
        ['[A-Z]+[0-9]+', ''],
        ['\\bUSD', ''],
        ['.*USD.*', 'BTCUSDC 2024 1.5'],
        ['\\D+', 'BTCUSDC '],
        ['\\w+\\s\\w+', 'BTCUSDC 2024'],
        ['[A-Z]{3}', 'BTC'],
    ])('ticker-style pattern %j', (pattern, expected) => {
        expect(str.match('BTCUSDC 2024 1.5', pattern)).toBe(expected);
    });

    it('reports an invalid pattern as a Pine runtime error', () => {
        for (const pattern of ['(abc', 'a{2', '*a', '\\q', '[a-']) {
            expect(() => str.match('abc', pattern), pattern).toThrow(PineRuntimeError);
        }
    });

    it('stops runaway backtracking with a runtime error instead of hanging', () => {
        expect(str.match('aaaa!', '(a+)+$')).toBe('');
        expect(() => str.match('a'.repeat(40) + '!', '(a+)+$')).toThrow(PineRuntimeError);
    });

    it('runs the patterns of a native Pine script', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-06-01').getTime(), new Date('2019-07-01').getTime());
        const { plots } = await pineTS.run(`//@version=5
indicator("str.match")
plot(str.length(str.match("hello123", "\\\\d+")), "m1")
plot(str.length(str.match("abc", "\\\\d+")) == 0 ? 1 : 0, "m2")
plot(str.length(str.match("2019-06-01", "\\\\d{4}")), "m3")
plot(str.length(str.match(syminfo.ticker, "[A-Z]+")), "m4")
`);
        // TradingView logs 3, 1, 4, 7 on every bar of this script (BINANCE:BTCUSDC).
        expect(plots.m1.data.at(-1).value).toBe(3);
        expect(plots.m2.data.at(-1).value).toBe(1);
        expect(plots.m3.data.at(-1).value).toBe(4);
        expect(plots.m4.data.at(-1).value).toBe(7);
    });
});
