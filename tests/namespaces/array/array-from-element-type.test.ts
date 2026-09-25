import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

// The element type of array.from() comes from the declared types of its arguments, as on
// TradingView: int literals / int variables / int built-ins make an int array, anything
// else numeric a float array. The type was inferred from the runtime values, so
// array.from(1.0, 2.0) and array.from(high) (on a whole-number price) became int arrays and
// the next float push failed with "An argument of 'literal number' type was used but a
// 'int' is expected" (LuxAlgo Island Reversal, ICT Silver Bullet).
//
// TradingView results: `array.from(1.0, 2.0)` + push(1.5) → size 3, last 1.5;
// `array.from(high)` + push(volume) → size 2; `array.from(1, 2.5)` → 1 and 2.5;
// `array.from(1, 2)` + push(3) → get(0) / 2 = 0.5; `array.from(1, 2)` + push(1.5) and
// `int n = 3; array.from(n, 4)` + push(1.5) → rejected (series int expected).

async function run(body: string, version = 6) {
    const src = `//@version=${version}
indicator("array.from type")
${body}`;
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-02').getTime());
    const { plots } = await pineTS.run(src);
    return (title: string) => plots[title].data[plots[title].data.length - 1].value;
}

describe('array.from element type', () => {
    it('makes a float array from float literals, float series and mixed arguments', async () => {
        const get = await run(`
a = array.from(1.0, 2.0)
a.push(1.5)
plot(a.size(), "aSize")
plot(a.get(2), "aLast")
b = array.from(high)
b.push(volume)
plot(b.size(), "bSize")
c = array.from(1, 2.5)
plot(c.get(0), "c0")
plot(c.get(1), "c1")
d = array.from(math.round(close))
d.push(0.5)
plot(d.size(), "dSize")`);
        expect(get('aSize')).toBe(3);
        expect(get('aLast')).toBe(1.5);
        expect(get('bSize')).toBe(2);
        expect(get('c0')).toBe(1);
        expect(get('c1')).toBe(2.5);
        expect(get('dSize')).toBe(2);
    });

    it('treats exponent literals as float (TradingView: array.from(0, 10e6) accepts set(0, high), v5 1e1 / 4 = 2.5)', async () => {
        const get = await run(`
var hilo = array.from(0, 10e6)
hilo.set(0, high)
plot(hilo.get(0) == high ? 1 : 0, "set")`);
        expect(get('set')).toBe(1);

        const v5 = await run(`plot(1e1 / 4, "exp")\nplot(10 / 4, "int")\nplot(2e0 / 4, "exp2")`, 5);
        expect(v5('exp')).toBe(2.5);
        expect(v5('int')).toBe(2);
        expect(v5('exp2')).toBe(0.5);
    });

    it('keeps a float array inside a UDT field', async () => {
        const get = await run(`
type R
    array<float> vols
r = R.new(array.from(high))
r.vols.push(volume)
r.vols.push(1.25)
plot(r.vols.size(), "size")`);
        expect(get('size')).toBe(3);
    });

    it('makes an int array from int literals, int variables and int built-ins', async () => {
        const get = await run(`
a = array.from(1, 2)
a.push(3)
plot(a.get(0) / 2, "half")
plot(a.size(), "size")`);
        expect(get('half')).toBe(0.5);
        expect(get('size')).toBe(3);

        await expect(run(`a = array.from(1, 2)\na.push(1.5)\nplot(a.size())`)).rejects.toThrow(/int/);
        await expect(run(`int n = 3\na = array.from(n, 4)\na.push(1.5)\nplot(a.size())`)).rejects.toThrow(/int/);
        await expect(run(`a = array.from(bar_index)\na.push(1.5)\nplot(a.size())`)).rejects.toThrow(/int/);
    });

    it('applies the same rules in Pine v5', async () => {
        const get = await run(`a = array.from(1.0, 2.0)\na.push(1.5)\nplot(a.size(), "size")`, 5);
        expect(get('size')).toBe(3);
        await expect(run(`a = array.from(1, 2)\na.push(1.5)\nplot(a.size())`, 5)).rejects.toThrow(/int/);
    });
});
