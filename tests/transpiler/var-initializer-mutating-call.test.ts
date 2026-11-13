import { describe, expect, it } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

// TradingView evaluates a `var` initializer on the first bar only. Expected values are its
// output for the same script on every bar: a1 joined is "1.0,-2.0,3.0,-4.0,5.0,10.0,20.0".
describe('a var initializer that mutates an argument', () => {
    it('runs once, so array.concat extends its first array a single time', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-07-01').getTime());
        const { plots } = await pineTS.run(`//@version=5
indicator("var concat")
var a1 = array.from(1.0, -2.0, 3.0, -4.0, 5.0)
var a2 = array.from(10.0, 20.0)
var merged = array.concat(a1, a2)
plot(array.size(a1), "a1")
plot(array.size(merged), "merged")
plot(array.get(a1, 6), "last")
`);
        expect(plots.a1.data.every((p: any) => p.value === 7)).toBe(true);
        expect(plots.merged.data.every((p: any) => p.value === 7)).toBe(true);
        expect(plots.last.data.at(-1).value).toBe(20);
    });
});
