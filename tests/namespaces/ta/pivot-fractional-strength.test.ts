import { describe, expect, it } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

// pivothigh/pivotlow take `series int/float` strengths. TradingView truncates them:
// pivothigh(close, 2.9, 1.9) equals pivothigh(close, 2, 1) on every bar of a 47k-bar chart.
describe('ta.pivothigh / ta.pivotlow with fractional strengths', () => {
    it('truncates the strengths instead of rejecting them', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-09-01').getTime());
        const { plots } = await pineTS.run(`//@version=5
indicator("fractional pivots")
f_eq(a, b) => na(a) and na(b) ? true : na(a) or na(b) ? false : a == b
ph = ta.pivothigh(close, 2.9, 1.2)
pl = ta.pivotlow(close, 2.9, 1.2)
plot(ph, "ph")
plot(f_eq(ph, ta.pivothigh(close, 2, 1)) ? 1 : 0, "phEq")
plot(f_eq(pl, ta.pivotlow(close, 2, 1)) ? 1 : 0, "plEq")
`);
        const at = (name: string, day: string) => plots[name].data.find((p: any) => new Date(p.time).toISOString().startsWith(day))?.value;
        // TradingView values of ta.pivothigh(close, 2.9, 1.2) on BINANCE:BTCUSDC 1W.
        expect(at('ph', '2019-06-03')).toBe(8743.6);
        expect(at('ph', '2019-06-24')).toBe(10847.25);
        expect(Number.isNaN(at('ph', '2019-06-10'))).toBe(true);
        expect(plots.phEq.data.every((p: any) => p.value === 1)).toBe(true);
        expect(plots.plEq.data.every((p: any) => p.value === 1)).toBe(true);
    });
});
