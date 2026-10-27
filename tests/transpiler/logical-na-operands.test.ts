import { describe, expect, it } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

// On TradingView `and` / `or` always give a bool: an na operand counts as false and the result is
// never na. Expected values are TradingView's output for the same script.
describe('and / or with na operands', () => {
    it('treat na as false and never return na', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-03-01').getTime());
        const { plots } = await pineTS.run(`//@version=5
indicator("na logic")
bool nb = na
float nf = na
plot(na(nb and false) ? 1 : 0, "v1")
plot(na(nb and true) ? 1 : 0, "v2")
plot(na(true and nb) ? 1 : 0, "v4")
plot(na(nb or true) ? 1 : 0, "v5")
plot(na(false or nb) ? 1 : 0, "v7")
plot(na(not nb) ? 1 : 0, "v9")
plot(na(nf > 0) ? 1 : 0, "cmpNa")
plot((nf > 0 or true) ? 1 : 0, "cmpOr")
plot((nb or true) ? 1 : 0, "w5")
a = true
b = false
c = false
plot(a and (b or c) ? 1 : 0, "grouped")
`);
        const last = (k: string) => plots[k].data.at(-1).value;
        expect(['v1', 'v2', 'v4', 'v5', 'v7', 'v9'].map(last)).toEqual([0, 0, 0, 0, 0, 0]);
        // A comparison with na is itself na, but inside `or` it counts as false.
        expect(last('cmpNa')).toBe(1);
        expect(last('cmpOr')).toBe(1);
        expect(last('w5')).toBe(1);
        expect(last('grouped')).toBe(0);
    });
});
