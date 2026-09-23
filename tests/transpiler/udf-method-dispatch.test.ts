// Parity of user-defined `method` dispatch against TradingView.
//
// Pine resolves `receiver.name(...)` from the receiver's type. PineTS infers that type
// statically, and used to give up when the receiver was anything other than a named
// variable with an explicit annotation, a constructor initializer, or a known UDT
// instance — leaving the call bound to nothing. Expected values come from running the
// same scripts on TradingView (BINANCE:BTCUSDT, 60) for bar_index 0..4.
import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

const BARS = 5;

async function firstBars(body: string): Promise<number[]> {
    const source = `//@version=6
indicator("udf-method")
${body.trim()}
plotchar(v, "v")
`;
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-03').getTime());
    const { plots } = await pineTS.run(source);
    return plots['v'].data.slice(0, BARS).map((d: any) => d.value);
}

describe('user-defined method dispatch', () => {
    it('dispatches on an explicitly typed receiver', async () => {
        expect(
            await firstBars(`
method twice(float a) => a * 2
float x = bar_index
v = x.twice()
`)
        ).toEqual([0, 2, 4, 6, 8]);
    });

    it('dispatches on a receiver whose type is only inferred', async () => {
        expect(
            await firstBars(`
method twice(float a) => a * 2
x = bar_index * 1.0
v = x.twice()
`)
        ).toEqual([0, 2, 4, 6, 8]);
    });

    it('dispatches on a parenthesized expression receiver', async () => {
        expect(
            await firstBars(`
method twice(float a) => a * 2
v = (bar_index + 0.0).twice()
`)
        ).toEqual([0, 2, 4, 6, 8]);
    });

    it('dispatches on the result of a user function', async () => {
        expect(
            await firstBars(`
method twice(float a) => a * 2
f(a) => a * 1.0
v = f(bar_index).twice()
`)
        ).toEqual([0, 2, 4, 6, 8]);
    });

    it('dispatches through a chain of method calls', async () => {
        expect(
            await firstBars(`
method twice(float a) => a * 2
float x = bar_index
v = x.twice().twice()
`)
        ).toEqual([0, 4, 8, 12, 16]);
    });

    it('dispatches through a chain of UDT method calls', async () => {
        expect(
            await firstBars(`
type P
    float x
method next(P p) => P.new(p.x + 1)
p = P.new(bar_index)
v = p.next().next().x
`)
        ).toEqual([2, 3, 4, 5, 6]);
    });

    it('returns the last statement of a method block body', async () => {
        expect(
            await firstBars(`
method twice(float a) =>
    b = a * 2
float x = bar_index
v = x.twice()
`)
        ).toEqual([0, 2, 4, 6, 8]);
    });

    // A user method may share a name with a built-in member. The user method wins for
    // its own receiver type; the built-in still wins everywhere else.
    it('keeps the built-in when a user method shares its name', async () => {
        expect(
            await firstBars(`
type P
    float x
method size(P p) => p.x * 2
arr = array.from(1.0, 2.0)
p = P.new(bar_index)
v = p.size() + arr.size()
`)
        ).toEqual([2, 4, 6, 8, 10]);
    });
});
