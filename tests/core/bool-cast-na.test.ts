import { describe, expect, it } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

const run = (version: number, body: string) =>
    new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-06-01').getTime(), new Date('2019-07-01').getTime())
        .run(`//@version=${version}\nindicator("bool(na)")\n${body}\n`);

describe('bool(na)', () => {
    // TradingView v5: na(bool(float(na))) is true, nz(bool(float(na)), true) is true,
    // and array.includes(bools, bool(na)) does not match an na element.
    it('stays na in a v5 script', async () => {
        const { plots } = await run(5, `
plot(na(bool(float(na))) ? 1 : 0, "isNa")
plot(nz(bool(float(na)), true) ? 1 : 0, "nz")
plot(bool(0.0) ? 1 : 0, "zero")
plot(bool(-1.5) ? 1 : 0, "nonzero")
b = array.new_bool(2, true)
array.set(b, 1, bool(na))
plot(array.includes(b, bool(na)) ? 1 : 0, "includes")`);
        const last = (k: string) => plots[k].data.at(-1).value;
        expect([last('isNa'), last('nz'), last('zero'), last('nonzero'), last('includes')]).toEqual([1, 1, 0, 1, 0]);
    });

    it('is false in a v6 script, where bools are never na', async () => {
        const { plots } = await run(6, `plot(na(bool(float(na))) ? 1 : 0, "isNa")
plot(bool(float(na)) ? 1 : 0, "value")`);
        expect(plots.isNa.data.at(-1).value).toBe(0);
        expect(plots.value.data.at(-1).value).toBe(0);
    });
});
