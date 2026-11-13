// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Series history and time functions pinned against TradingView (BTCUSDC 1W, the same bars as the
 * Mock weekly data). Every expected value is TradingView's output for the same script.
 */
import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

const runW = async (code: string, end = '2019-09-01') => {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date(end).getTime());
    const { plots } = await pineTS.run(code);
    const at = (name: string, day: string) => plots[name].data.find((p: any) => new Date(p.time).toISOString().slice(0, 10) === day)?.value;
    return { plots, at };
};

describe('history of call results, nested parameters and barstate (TradingView)', () => {
    it('str.* call results keep a per-bar history', async () => {
        const { plots, at } = await runW(`//@version=5
indicator("h")
s1 = str.tostring(close)[1]
plot(s1 == str.tostring(close[1]) ? 1 : 0, "e1")
plot(na(s1) ? 1 : 0, "s1na")
plot(str.upper(close > open ? 'up' : 'dn')[1] == (close[1] > open[1] ? 'UP' : 'DN') ? 1 : 0, "e3")
`);
        // TV: 1 on every bar after the first; the first bar has no previous string
        expect(plots['s1na'].data[0].value).toBe(1);
        for (const day of ['2019-06-03', '2019-07-01', '2019-08-26']) {
            expect(at('e1', day)).toBe(1);
            expect(at('e3', day)).toBe(1);
        }
    });

    it('a parameter passed on to another function keeps its history', async () => {
        const { at } = await runW(`//@version=5
indicator("h")
l1(float s) => s + s[1]
l2(float s) => l1(s) + s[1] * 2.0
l3(float s) => l2(s) + s[1] * 3.0
m1(float s) => s[1]
m2(float s) => m1(s * 2.0)
m3(float s) => m2(s + 1.0)
v1 = l3(close)
plot(v1, "v1")
plot(v1 == close + close[1] + close[1] * 2.0 + close[1] * 3.0 ? 1 : 0, "f1")
plot(m3(close) == (close[1] + 1.0) * 2.0 ? 1 : 0, "f2")
`);
        for (const day of ['2019-06-03', '2019-07-15']) {
            expect(at('f1', day)).toBe(1);
            expect(at('f2', day)).toBe(1);
        }
    });

    it('barstate.* variables have a history', async () => {
        const { at } = await runW(`//@version=5
indicator("h")
plot(barstate.isconfirmed[1] ? 1 : 0, "e3")
plot(barstate.isnew[1] ? 1 : 0, "e4")
plot(barstate.isfirst[1] ? 1 : 0, "e5")
plot(barstate.ishistory[1] ? 1 : 0, "e6")
`);
        // TV, historical bars in the window: 1 | 1 | 0 | 1
        expect([at('e3', '2019-06-10'), at('e4', '2019-06-10'), at('e5', '2019-06-10'), at('e6', '2019-06-10')]).toEqual([1, 1, 0, 1]);
        expect(at('e5', '2018-12-17')).toBe(1);
    });

    it('ta.barssince called on alternate bars counts its own calls', async () => {
        const { at } = await runW(`//@version=5
indicator("h")
int v5 = na
if bar_index % 2 == 0
    v5 := ta.barssince(ta.change(close) < 0)
plot(v5, "v5")
`);
        // TV: 11 on 2019-06-10, 12 on 2019-06-24
        expect(at('v5', '2019-06-10')).toBe(11);
        expect(at('v5', '2019-06-24')).toBe(12);
    });
});

describe('time functions (TradingView)', () => {
    it('reads GMT+HHMM offsets and a GMT+N suffix in a date string', async () => {
        const { at } = await runW(`//@version=5
indicator("t")
ts1 = timestamp("2019-06-03T23:30:00")
plot(hour(ts1, "GMT+0530"), "h")
plot(dayofmonth(ts1, "GMT+0530"), "d")
plot(minute(ts1, "GMT+0530"), "m")
plot(timestamp("GMT+0530", 2019, 6, 3, 12, 0, 0) - timestamp("GMT+0", 2019, 6, 3, 12, 0, 0), "off")
plot(timestamp("04 Dec 1995 00:12:00 GMT+5"), "rfc")
`);
        const day = '2019-06-03';
        // TV: 5 | 4 | 0 | -19800000 | 818017920000
        expect([at('h', day), at('d', day), at('m', day), at('off', day), at('rfc', day)]).toEqual([5, 4, 0, -19800000, 818017920000]);
    });

    it('time / time_close with a higher timeframe and negative bars_back', async () => {
        const { at } = await runW(`//@version=5
indicator("t")
plot(time_close("1M"), "tc1M")
plot(time("1W", -1) - time_close, "next")
plot(time("", -5) - time, "fut")
plot(time_close("", -5) - time_close, "futc")
plot(time("1M", -1), "m1")
plot(time_close("1M", 1), "tcm1")
`);
        // TV, 2019-06-03: 1561939200000 | 0 | 3024000000 | 3024000000 | 1559347200000
        const day = '2019-06-03';
        expect([at('tc1M', day), at('next', day), at('fut', day), at('futc', day), at('m1', day)]).toEqual([1561939200000, 0, 3024000000, 3024000000, 1559347200000]);
        // TV, 2019-06-10: the monthly bar holding the previous weekly bar closes 2019-07-01
        expect(at('tcm1', '2019-06-10')).toBe(1561939200000);
    });

    it('v6 timeframe_bars_back moves by bars of the requested timeframe', async () => {
        const { at } = await runW(`//@version=6
indicator("t")
plot(time("1W", "", 0, 1) - time[1], "v2")
plot(time("1M", "", 0, 1), "v3")
plot(time("1M", "", 1, 0), "v4")
plot(time("1W", "", 0, -1) - time_close, "v5")
plot(time_close("1M", "", 0, 1), "v6")
plot(time("1W", "", 2, 3) - time[5], "v8")
`);
        const day = '2019-06-03';
        // TV: 0 | 1556668800000 | 1556668800000 | 0 | 1559347200000 | 0
        expect([at('v2', day), at('v3', day), at('v4', day), at('v5', day), at('v6', day), at('v8', day)]).toEqual([0, 1556668800000, 1556668800000, 0, 1559347200000, 0]);
    });
});
