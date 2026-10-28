import { describe, expect, it } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

// Expected values are TradingView's output for the same script.
describe('enum member as a function parameter default', () => {
    it('applies the default when the argument is omitted', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-06-01').getTime(), new Date('2019-07-01').getTime());
        const { plots } = await pineTS.run(`//@version=5
indicator("enum default")
enum Sig
    up
    dn

pick(Sig s = Sig.dn) => s

plot(pick() == Sig.dn ? 1 : 0, "v1")
plot(pick(Sig.up) == Sig.up ? 1 : 0, "v2")
v3 = switch pick()
    Sig.up => 1
    Sig.dn => 2
    => 0
plot(v3, "v3")
plot(pick() == pick() ? 1 : 0, "v4")
`);
        const last = (k: string) => plots[k].data.at(-1).value;
        expect([last('v1'), last('v2'), last('v3'), last('v4')]).toEqual([1, 1, 2, 1]);
    });
});
