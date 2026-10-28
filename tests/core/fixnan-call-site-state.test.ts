import { describe, expect, it } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

// TradingView's fixnan carries the last non-na value seen by its own call site: called only inside
// a block, it ignores the values of bars where the block did not run.
describe('fixnan call-site state', () => {
    it('only remembers values from bars where the call ran', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-04-01').getTime());
        const { plots } = await pineTS.run(`//@version=5
indicator("fixnan call site")
src = bar_index % 2 == 0 ? close : na
float inBlock = na
// The block only runs on odd bars, where src is always na.
if bar_index % 2 == 1
    inBlock := fixnan(src)
plot(inBlock, "inBlock")
plot(fixnan(src), "everyBar")
`);
        const odd = plots.inBlock.data.filter((_: any, i: number) => i % 2 === 1);
        expect(odd.every((p: any) => Number.isNaN(p.value))).toBe(true);
        // Called on every bar, the last value carries forward.
        const every = plots.everyBar.data;
        expect(every[1].value).toBe(every[0].value);
        expect(Number.isFinite(every.at(-1).value)).toBe(true);
    });
});
