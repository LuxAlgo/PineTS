import { describe, expect, it } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

const at = (plot: any, day: string) => plot.data.find((p: any) => new Date(p.time).toISOString().startsWith(day))?.value;

// TradingView values on BINANCE:BTCUSDC 1W: the loop's value is close[4], from its last iteration.
describe('history access with the counter of a loop used as a value', () => {
    it('reads close[i] at the counter value', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-07-01').getTime());
        const { plots } = await pineTS.run(`//@version=5
indicator("loop value history")
r = for i = 0 to 4
    close[i]
plot(r, "r")
`);
        expect(at(plots.r, '2019-06-03')).toBe(6947.86);
        expect(at(plots.r, '2019-06-10')).toBe(8200);
    });
});
