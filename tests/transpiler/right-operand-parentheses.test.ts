import { describe, expect, it } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

// Expected values are TradingView's output for the same expressions.
describe('parenthesized right operands', () => {
    it('keeps them for non-associative operators and evaluates + chains as TradingView does', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-03-01').getTime());
        const { plots } = await pineTS.run(`//@version=5
indicator("parentheses")
plot(barstate.isfirst == (bar_index == 0) ? 1 : 0, "eqOfEq")
plot(10 - (4 - 1), "sub")
plot(true == (1 < 2) ? 1 : 0, "eqOfLt")
float big = 1.0e16 * (close / close)
plot(1.0 + (big - big), "absorbed")
`);
        expect(plots.eqOfEq.data.every((p: any) => p.value === 1)).toBe(true);
        expect(plots.sub.data.at(-1).value).toBe(7);
        expect(plots.eqOfLt.data.at(-1).value).toBe(1);
        // TradingView evaluates 1.0 + (big - big) as (1.0 + big) - big: the 1 is absorbed at 1e16.
        expect(plots.absorbed.data.at(-1).value).toBe(0);
    });
});
