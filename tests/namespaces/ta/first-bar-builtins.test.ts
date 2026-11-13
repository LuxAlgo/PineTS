import { describe, expect, it } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

// Values TradingView returns on the first two bars of BINANCE:BTCUSDC 1W (2018-12-10, 2018-12-17).
describe('built-ins on the first bar', () => {
    it('match TradingView before a previous close exists', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-03-01').getTime());
        const { plots } = await pineTS.run(`//@version=5
indicator("first bar")
plot(ta.obv, "obv")
plot(ta.pvt, "pvt")
plot(ta.tr, "tr")
plot(ta.tr(true), "trTrue")
plot(ta.tr(false), "trFalse")
[st, dir] = ta.supertrend(3, 10)
plot(st, "st")
plot(dir, "dir")
`);
        const bar = (k: string, i: number) => plots[k].data[i].value;
        // The first change is na: OBV and PVT are na, then start from 0.
        expect(Number.isNaN(bar('obv', 0))).toBe(true);
        expect(Number.isNaN(bar('pvt', 0))).toBe(true);
        expect(bar('obv', 1)).toBeCloseTo(10563.102, 3);
        expect(bar('pvt', 1)).toBeCloseTo(2490.225, 3);
        // The bare ta.tr is ta.tr(false).
        expect(Number.isNaN(bar('tr', 0))).toBe(true);
        expect(bar('trTrue', 0)).toBe(312.32);
        expect(Number.isNaN(bar('trFalse', 0))).toBe(true);
        expect(bar('tr', 1)).toBe(982.75);
        // TradingView's supertrend formula reads 0 with direction 1 on the first bar, then na while the ATR warms up.
        expect([bar('st', 0), bar('dir', 0)]).toEqual([0, 1]);
        expect(Number.isNaN(bar('st', 1))).toBe(true);
    });
});
