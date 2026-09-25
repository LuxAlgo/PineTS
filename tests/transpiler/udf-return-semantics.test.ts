// Parity of user-defined-function return semantics against TradingView.
//
// In Pine Script the value of a function is the value of its LAST statement, whatever
// kind of statement that is — a bare expression, a declaration, a `:=` reassignment,
// an if/else, or a loop. Every expected array below was produced by running the same
// script on TradingView (BINANCE:BTCUSDT, 60) and reading its log.info output for
// bar_index 0..4; the scripts only ever read `bar_index`, so the values are independent
// of the market data feed.
import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

const BARS = 5;

async function firstBars(body: string, plots: string[] = ['v']): Promise<Record<string, number[]>> {
    const source = `//@version=6
indicator("udf")
${body.trim()}
${plots.map((p) => `plotchar(${p}, "${p}")`).join('\n')}
`;
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-03').getTime());
    const { plots: out } = await pineTS.run(source);
    return Object.fromEntries(plots.map((p) => [p, out[p].data.slice(0, BARS).map((d: any) => d.value)]));
}

describe('user-defined function return semantics', () => {
    describe('last statement is a declaration', () => {
        it('returns the declared value (block body)', async () => {
            const { v } = await firstBars(`
f(a) =>
    b = a * 2
v = f(bar_index)
`);
            expect(v).toEqual([0, 2, 4, 6, 8]);
        });

        it('returns the declared value (single-line body)', async () => {
            const { v } = await firstBars(`
f(a) => b = a * 2
v = f(bar_index)
`);
            expect(v).toEqual([0, 2, 4, 6, 8]);
        });

        it('returns the last of several declarations', async () => {
            const { v } = await firstBars(`
f(a) =>
    b = a * 2
    c = b + 1
v = f(bar_index)
`);
            expect(v).toEqual([1, 3, 5, 7, 9]);
        });

        it('returns the value of a single-line comma sequence', async () => {
            const { v } = await firstBars(`
f(a) => b = a * 2, c = b + 1, b + c
v = f(bar_index)
`);
            expect(v).toEqual([1, 5, 9, 13, 17]);
        });

        it('returns the declaration ending a single-line comma sequence', async () => {
            const { v } = await firstBars(`
f(a) => b = 2, c = 3, d = a + b + c
v = f(1)
`);
            expect(v).toEqual([6, 6, 6, 6, 6]);
        });

        it('returns a var declared as the last statement', async () => {
            const { v } = await firstBars(`
f(a) =>
    var b = 7.0
v = f(bar_index)
`);
            expect(v).toEqual([7, 7, 7, 7, 7]);
        });

        it('returns a UDT declared as the last statement', async () => {
            const { v } = await firstBars(`
type P
    float x
f(a) =>
    q = P.new(a)
v = f(bar_index).x
`);
            expect(v).toEqual([0, 1, 2, 3, 4]);
        });
    });

    describe('last statement is a reassignment', () => {
        it('returns the reassigned value', async () => {
            const { v } = await firstBars(`
f(a) =>
    b = a
    b := b * 3
v = f(bar_index)
`);
            expect(v).toEqual([0, 3, 6, 9, 12]);
        });

        it('returns the reassigned value of a var (accumulator)', async () => {
            const { v } = await firstBars(`
f(a) =>
    var b = 0.0
    b := b + a
v = f(bar_index)
`);
            expect(v).toEqual([0, 1, 3, 6, 10]);
        });
    });

    describe('last statement is a conditional', () => {
        it('returns the declared value from the taken branch', async () => {
            const { v } = await firstBars(`
f(a) =>
    if a > 2
        b = a * 10
    else
        c = a * 100
v = f(bar_index)
`);
            expect(v).toEqual([0, 100, 200, 30, 40]);
        });

        it('returns na when an if has no else and the test is false', async () => {
            const { v } = await firstBars(`
f(a) =>
    if a > 2
        a * 10
v = f(bar_index)
`);
            expect(v).toEqual([NaN, NaN, NaN, 30, 40]);
        });

        it('returns na when an if/else-if chain has no final else', async () => {
            const { v } = await firstBars(`
f(a) =>
    if a > 3
        1.0
    else if a > 1
        2.0
v = f(bar_index)
`);
            expect(v).toEqual([NaN, NaN, 2, 2, 1]);
        });
    });

    describe('last statement is a loop', () => {
        it('returns the value the loop body last produced', async () => {
            const { v } = await firstBars(`
f(a) =>
    s = 0.0
    for i = 0 to 2
        s := s + a + i
v = f(bar_index)
`);
            expect(v).toEqual([3, 6, 9, 12, 15]);
        });
    });

    describe('tuple returns', () => {
        it('keeps a bare parameter in the first tuple slot', async () => {
            const { x, y } = await firstBars(`
f(a) => [a, a * 2]
[x, y] = f(bar_index)
`, ['x', 'y']);
            expect(x).toEqual([0, 1, 2, 3, 4]);
            expect(y).toEqual([0, 2, 4, 6, 8]);
        });

        it('keeps every bare parameter of a tuple of parameters', async () => {
            const { x, y } = await firstBars(`
f(a, b) => [a, b]
[x, y] = f(bar_index, bar_index * 5)
`, ['x', 'y']);
            expect(x).toEqual([0, 1, 2, 3, 4]);
            expect(y).toEqual([0, 5, 10, 15, 20]);
        });

        it('handles a three-slot tuple', async () => {
            const { x, y, z } = await firstBars(`
f(a) => [a, a * 2, a * 3]
[x, y, z] = f(bar_index)
`, ['x', 'y', 'z']);
            expect(x).toEqual([0, 1, 2, 3, 4]);
            expect(y).toEqual([0, 2, 4, 6, 8]);
            expect(z).toEqual([0, 3, 6, 9, 12]);
        });

        it('forwards a tuple through another user function', async () => {
            const { x, y } = await firstBars(`
f(a) => [a, a * 2]
g(a) =>
    [p, q] = f(a)
    [q, p]
[x, y] = g(bar_index)
`, ['x', 'y']);
            expect(x).toEqual([0, 2, 4, 6, 8]);
            expect(y).toEqual([0, 1, 2, 3, 4]);
        });

        it('returns a tuple built in a block body', async () => {
            const { x, y } = await firstBars(`
f(a) =>
    b = a * 2
    [a, b]
[x, y] = f(bar_index)
`, ['x', 'y']);
            expect(x).toEqual([0, 1, 2, 3, 4]);
            expect(y).toEqual([0, 2, 4, 6, 8]);
        });
    });
});
