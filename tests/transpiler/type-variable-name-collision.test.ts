import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

// A variable may share its name with a user-defined type: `var fib fib = fib.new(...)`
// (LuxAlgo Fibonacci Trailing Stop). `fib.new()` names the type, every other use names the
// variable. Both were emitted as the same JavaScript binding, so the script failed with
// "Identifier 'fib' has already been declared".
//
// TradingView: the global script below logs "1 true 2"; the local one logs "3.5".

async function run(body: string) {
    const src = `//@version=6
indicator("type / variable collision")
${body}`;
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-02').getTime());
    const { plots } = await pineTS.run(src);
    return (title: string) => plots[title].data[plots[title].data.length - 1].value;
}

describe('a variable named like a user-defined type', () => {
    it('works for a global var declaration', async () => {
        const get = await run(`
type fib
    float lvl
    int n = 0
var fib fib = fib.new(1.0)
fib.n += 1
other = fib.new(2.0)
plot(fib.lvl, "lvl")
plot(fib.n > 0 ? 1 : 0, "counted")
plot(other.lvl, "other")`);
        expect(get('lvl')).toBe(1);
        expect(get('counted')).toBe(1);
        expect(get('other')).toBe(2);
    });

    it('works for a local declaration inside a function', async () => {
        const get = await run(`
type level
    float price
f(float p) =>
    level level = level.new(p)
    level.price
plot(f(3.5), "price")`);
        expect(get('price')).toBe(3.5);
    });

    // TradingView: "7 2 4". `fib.new(...)` and `fib.copy(...)` always name the type — a bare
    // `fib.copy()` is rejected with "No value assigned to the "object" parameter in fib.copy()".
    it('works for untyped declarations, reassignment, copy() and nested fields', async () => {
        const get = await run(`
type pt
    float x
type fib
    pt lf
    float lvl
fib = fib.new(pt.new(5.0), 1.0)
fib := fib.new(pt.new(7.0), 2.0)
dup = fib.copy(fib)
plot(fib.   lf.x, "nested")
plot(fib.lvl, "lvl")
plot(dup.lvl * 2, "copy")`);
        expect(get('nested')).toBe(7);
        expect(get('lvl')).toBe(2);
        expect(get('copy')).toBe(4);
    });
});
