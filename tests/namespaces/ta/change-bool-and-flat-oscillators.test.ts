import { describe, expect, it } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

const at = (plot: any, day: string) => plot.data.find((p: any) => new Date(p.time).toISOString().startsWith(day))?.value;

// Expected values are TradingView's output for the same scripts on BINANCE:BTCUSDC 1W.
describe('ta.change bool overload', () => {
    it('returns whether the bool changed', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-07-15').getTime());
        const { plots } = await pineTS.run(`//@version=5
indicator("change bool")
b = close > open
plot(ta.change(b) ? 1 : 0, "c1")
plot(ta.change(b, 3) ? 1 : 0, "c3")
plot(ta.change(math.round(close / 1000)), "int")
`);
        const expected: Array<[string, number, number, number]> = [
            ['2019-06-03', 1, 1, -1],
            ['2019-06-10', 1, 0, 1],
            ['2019-06-17', 0, 0, 2],
            ['2019-06-24', 1, 0, 0],
            ['2019-07-08', 1, 1, -1],
        ];
        for (const [day, c1, c3, int] of expected) {
            expect([at(plots.c1, day), at(plots.c3, day), at(plots.int, day)], day).toEqual([c1, c3, int]);
        }
    });
});

describe('oscillators on a flat series', () => {
    it('give na where TradingView divides 0 by 0', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-07-01').getTime());
        const { plots } = await pineTS.run(`//@version=5
indicator("flat oscillators")
flat = close * 0 + 5.0
plot(ta.cci(flat, 14), "cci")
plot(na(ta.cmo(flat, 14)) ? 1 : 0, "cmoNa")
plot(ta.cog(flat, 14), "cog")
plot(ta.mfi(flat, 14), "mfi")
plot(na(ta.tsi(flat, 3, 6)) ? 1 : 0, "tsiNa")
`);
        const last = (k: string) => plots[k].data.at(-1).value;
        expect(last('cci')).toBe(0);
        expect(last('cmoNa')).toBe(1);
        expect(last('cog')).toBe(-7.5);
        expect(last('mfi')).toBe(100);
        expect(last('tsiNa')).toBe(1);
    });
});
