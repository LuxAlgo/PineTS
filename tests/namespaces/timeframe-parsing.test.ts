// SPDX-License-Identifier: AGPL-3.0-only
// Timeframe strings shared by request.security, timeframe.* and time(). Every expected value
// below was measured on TradingView (BINANCE:BTCUSDT / BINANCE:ADAUSDT, 1h, 1D and multi-unit
// charts):
// - minutes and seconds bars restart at 00:00 UTC every day ("300" -> 00:00, 05:00, ..., 20:00);
// - ND bars count N days from January 1 (2024-12-30 is a 2-day bar, 2025-12-31 a 1-day bar);
// - NW bars count N weeks from the first Monday of the year (2024-12-30 is a 1-week 2W bar);
// - NM bars count N months from January ("3M" = quarters, "12M" = calendar years);
// - bars are stamped with their calendar open even when data starts later (12M bar 0 = 2017-01-01).

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';
import { aggregateCandles } from '@pinets/marketData/aggregation';
import { Kline } from '@pinets/marketData/types';

const H = 3_600_000;
const D = 86_400_000;
const iso = (t: number) => new Date(t).toISOString().slice(0, 16);

function series(plots: any, title: string): Map<number, any> {
    return new Map((plots[title]?.data ?? []).map((p: any) => [p.time, p.value]));
}

async function run1h(source: string, sDate = Date.UTC(2024, 11, 20), eDate = Date.UTC(2025, 0, 10)) {
    return new PineTS(Provider.Mock, 'BTCUSDC', '60', null, sDate, eDate).run(source);
}

describe('request.security with any valid timeframe (K1, 7a)', () => {
    const tfs = ['300', '480', '720', '2D', '3D', '2W', '3M', '12M'];
    const source =
        `//@version=6\nindicator("tfs")\n` +
        tfs.map((tf) => `plot(request.security(syminfo.tickerid, "${tf}", time, lookahead = barmerge.lookahead_on), "${tf}")`).join('\n') +
        '\n' +
        tfs.map((tf) => `plot(time("${tf}"), "time ${tf}")`).join('\n');

    it('returns the open time of the TradingView bar that holds each chart bar', async () => {
        const { plots } = await run1h(source);
        const at = (tf: string, t: string) => iso(series(plots, tf).get(Date.parse(t)));

        // last hour of 2024 (a leap year)
        expect(at('300', '2024-12-31T23:00Z')).toBe('2024-12-31T20:00');
        expect(at('480', '2024-12-31T23:00Z')).toBe('2024-12-31T16:00');
        expect(at('720', '2024-12-31T23:00Z')).toBe('2024-12-31T12:00');
        expect(at('2D', '2024-12-31T23:00Z')).toBe('2024-12-30T00:00');
        expect(at('3D', '2024-12-31T23:00Z')).toBe('2024-12-29T00:00');
        expect(at('2W', '2024-12-31T23:00Z')).toBe('2024-12-30T00:00');
        expect(at('3M', '2024-12-31T23:00Z')).toBe('2024-10-01T00:00');
        expect(at('12M', '2024-12-31T23:00Z')).toBe('2024-01-01T00:00');

        // first hour of 2025: day, month and year grids restart; the 2W bar of 2024-12-30 runs to the first Monday
        expect(at('300', '2025-01-01T00:00Z')).toBe('2025-01-01T00:00');
        expect(at('2D', '2025-01-01T00:00Z')).toBe('2025-01-01T00:00');
        expect(at('3D', '2025-01-01T00:00Z')).toBe('2025-01-01T00:00');
        expect(at('2W', '2025-01-01T00:00Z')).toBe('2024-12-30T00:00');
        expect(at('3M', '2025-01-01T00:00Z')).toBe('2025-01-01T00:00');
        expect(at('12M', '2025-01-01T00:00Z')).toBe('2025-01-01T00:00');

        expect(at('2W', '2025-01-05T23:00Z')).toBe('2024-12-30T00:00');
        expect(at('2W', '2025-01-06T00:00Z')).toBe('2025-01-06T00:00');
        expect(at('3D', '2025-01-04T00:00Z')).toBe('2025-01-04T00:00');
    });

    it('time(tf) gives the same bar open times as request.security', async () => {
        const { plots } = await run1h(source);
        for (const tf of tfs) {
            const sec = series(plots, tf);
            const tm = series(plots, `time ${tf}`);
            expect(sec.size).toBeGreaterThan(400);
            for (const [t, v] of sec) expect(tm.get(t), `${tf} at ${iso(t)}`).toBe(v);
        }
    });

    it('reads "3M" as three months, not three minutes', async () => {
        const { plots } = await run1h(`//@version=6
indicator("3M")
t3 = request.security(syminfo.tickerid, "3M", time)
plot(minute(t3), "minute")
plot(dayofmonth(t3), "dom")
plot(month(t3), "month")`);
        const values = (title: string) => [...series(plots, title).values()].filter((v) => !isNaN(v));
        expect(values('minute').length).toBeGreaterThan(400);
        expect(new Set(values('minute'))).toEqual(new Set([0]));
        expect(new Set(values('dom'))).toEqual(new Set([1]));
        for (const m of values('month')) expect([1, 4, 7, 10]).toContain(m);
    });

    it('aggregates HTF candles from sub-candles (a 480 bar = two 240 bars)', async () => {
        const { plots } = await run1h(`//@version=6
indicator("480")
[o, h, l, c] = request.security(syminfo.tickerid, "480", [open, high, low, close], lookahead = barmerge.lookahead_on)
[o4, h4, l4, c4] = request.security(syminfo.tickerid, "240", [open, high, low, close], lookahead = barmerge.lookahead_on)
plot(o, "o")
plot(h, "h")
plot(c, "c")
plot(o4[4], "o4 first")
plot(math.max(h4, h4[4]), "h4 max")
plot(c4, "c4")`);
        // chart bars 07:00 and 15:00 are the last hour of a 480 bar (00-08, 08-16): the 480 bar is
        // the 240 bar four hours earlier followed by the current one
        for (const hour of ['2025-01-02T07:00Z', '2025-01-02T15:00Z', '2025-01-05T23:00Z']) {
            const t = Date.parse(hour);
            expect(series(plots, 'o').get(t)).toBe(series(plots, 'o4 first').get(t));
            expect(series(plots, 'h').get(t)).toBe(series(plots, 'h4 max').get(t));
            expect(series(plots, 'c').get(t)).toBe(series(plots, 'c4').get(t));
        }
    });

    it('does not treat "7D" as the weekly chart timeframe: 7D bars follow the yearly day grid', async () => {
        const { plots } = await new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, Date.UTC(2024, 11, 1), Date.UTC(2025, 1, 1)).run(`//@version=6
indicator("7D")
plot(request.security(syminfo.tickerid, "7D", time, lookahead = barmerge.lookahead_on), "7D")
plot(request.security(syminfo.tickerid, "W", time, lookahead = barmerge.lookahead_on), "W")`);
        const week = Date.UTC(2025, 0, 6);
        expect(iso(series(plots, 'W').get(week))).toBe('2025-01-06T00:00');
        expect(iso(series(plots, '7D').get(week))).toBe('2025-01-01T00:00');
        expect(iso(series(plots, '7D').get(Date.UTC(2025, 0, 13)))).toBe('2025-01-08T00:00');
    });

    it('rejects strings that are not timeframes with TradingView\'s message', async () => {
        for (const tf of ['abc', '2880']) {
            await expect(run1h(`//@version=6\nindicator("x")\nplot(request.security(syminfo.tickerid, "${tf}", close))`)).rejects.toThrow(
                `Invalid value of the 'timeframe' argument ('${tf}') in the 'security' function.`
            );
        }
    });
});

describe('timeframe.change and time() on multi-unit timeframes (K8)', () => {
    it('fires on the first chart bar of each new bar of the timeframe', async () => {
        const { plots } = await run1h(`//@version=6
indicator("change")
plot(timeframe.change("2D") ? 1 : 0, "2D")
plot(timeframe.change("2W") ? 1 : 0, "2W")
plot(timeframe.change("3M") ? 1 : 0, "3M")
plot(timeframe.change("12M") ? 1 : 0, "12M")
plot(timeframe.change("") ? 1 : 0, "chart")`);
        const fired = (title: string) =>
            [...series(plots, title)].filter(([, v]) => v === 1).map(([t]) => iso(t));
        expect(fired('2D')).toEqual(
            ['2024-12-22', '2024-12-24', '2024-12-26', '2024-12-28', '2024-12-30', '2025-01-01', '2025-01-03', '2025-01-05', '2025-01-07', '2025-01-09'].map((d) => `${d}T00:00`)
        );
        expect(fired('2W')).toEqual(['2024-12-30T00:00', '2025-01-06T00:00']);
        expect(fired('3M')).toEqual(['2025-01-01T00:00']);
        expect(fired('12M')).toEqual(['2025-01-01T00:00']);
        // "" is the chart timeframe: every bar but the first opens a new chart bar
        const chart = [...series(plots, 'chart').values()];
        expect(chart[0]).toBe(0);
        expect(chart.slice(1).every((v) => v === 1)).toBe(true);
    });

    it('rejects strings that are not timeframes with TradingView\'s message', async () => {
        await expect(run1h(`//@version=6\nindicator("x")\nplot(timeframe.change("abc") ? 1 : 0)`)).rejects.toThrow(
            "Cannot parse resolution 'abc'. - Invalid format"
        );
        await expect(run1h(`//@version=6\nindicator("x")\nplot(time("abc"))`)).rejects.toThrow("Cannot parse resolution 'abc'. - Invalid format");
    });
});

describe('timeframe.in_seconds / timeframe.from_seconds (K8, 18)', () => {
    it('in_seconds uses 2628003 s per month and the chart timeframe for ""', async () => {
        const cases: Record<string, number> = {
            '': 3600, '1S': 1, '30S': 30, '1': 60, '45': 2700, '90': 5400, '360': 21600, '1440': 86400,
            D: 86400, '1D': 86400, '2D': 172800, '3D': 259200, W: 604800, '2W': 1209600,
            M: 2628003, '1M': 2628003, '3M': 7884009, '6M': 15768018, '12M': 31536036,
        };
        const { plots } = await run1h(
            `//@version=6\nindicator("in_seconds")\n` + Object.keys(cases).map((tf) => `plot(timeframe.in_seconds("${tf}"), "s ${tf}")`).join('\n'),
            Date.UTC(2025, 0, 1),
            Date.UTC(2025, 0, 2)
        );
        for (const [tf, seconds] of Object.entries(cases)) {
            expect([...series(plots, `s ${tf}`).values()].at(-1), `in_seconds("${tf}")`).toBe(seconds);
        }
    });

    it('from_seconds rounds up to the next valid timeframe string', async () => {
        const cases: [number, string][] = [
            [0, '1S'], [1, '1S'], [2, '5S'], [6, '10S'], [14, '15S'], [16, '30S'], [30, '30S'], [31, '1'], [45, '1'], [59, '1'],
            [60, '1'], [61, '2'], [3599, '60'], [3600, '60'], [3601, '61'], [86399, '1440'], [86400, '1D'], [86401, '2D'],
            [604799, '7D'], [604800, '1W'], [604801, '8D'], [1814400, '3W'], [1814401, '22D'], [2592000, '30D'],
            [2628003, '1M'], [2628004, '31D'], [5256006, '2M'], [7884008, '92D'], [13140015, '5M'], [17280000, '200D'],
            [31449600, '52W'], [31449601, '365D'], [31535999, '365D'], [31536000, '12M'], [31536036, '12M'], [63072072, '12M'],
        ];
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, Date.UTC(2025, 0, 1), Date.UTC(2025, 0, 1, 3));
        const source = `($) => {
            const { timeframe } = $.pine;
            return { ${cases.map(([s], i) => `f${i}: timeframe.from_seconds(${s})`).join(', ')} };
        }`;
        const { result } = await pineTS.run(source);
        cases.forEach(([s, tf], i) => expect(result[`f${i}`].at(-1), `from_seconds(${s})`).toBe(tf));
    });

    it('in_seconds accepts the result of from_seconds on a series (18)', async () => {
        const { plots } = await run1h(
            `//@version=6
indicator("18")
tf = timeframe.from_seconds(timeframe.in_seconds() * 2)
plot(timeframe.in_seconds(tf), "twice")
tfs = timeframe.from_seconds(bar_index % 3 == 0 ? 60 : bar_index % 3 == 1 ? 86400 : 45)
plot(timeframe.in_seconds(tfs), "series")
plot(bar_index, "bar_index")`,
            Date.UTC(2025, 0, 1),
            Date.UTC(2025, 0, 2)
        );
        expect(new Set(series(plots, 'twice').values())).toEqual(new Set([7200]));
        const bars = [...series(plots, 'bar_index').values()];
        const got = [...series(plots, 'series').values()];
        expect(got).toEqual(bars.map((b) => (b % 3 === 1 ? 86400 : 60)));
    });

    it('in_seconds rejects strings that are not timeframes', async () => {
        await expect(run1h(`//@version=6\nindicator("x")\nplot(timeframe.in_seconds("abc"))`)).rejects.toThrow(
            "Invalid value of the 'period' argument ('abc') in the 'timeframe.in_seconds()' function."
        );
    });
});

describe('multi-unit chart timeframes', () => {
    const vars = `plot(timeframe.multiplier, "multiplier")
plot(timeframe.isdaily ? 1 : 0, "isdaily")
plot(timeframe.ismonthly ? 1 : 0, "ismonthly")
plot(timeframe.in_seconds(), "in_seconds")
plot(timeframe.period == "2D" ? 1 : 0, "period 2D")
plot(timeframe.period == "12M" ? 1 : 0, "period 12M")
plot(time_close, "time_close")`;

    it('builds 2D candles on the yearly day grid', async () => {
        const { plots, marketData } = await new PineTS(Provider.Mock, 'BTCUSDT', '2D', null, Date.UTC(2024, 6, 20), Date.UTC(2026, 0, 5)).run(
            `//@version=6\nindicator("2D")\n` + vars
        );
        const bar = marketData.find((k: Kline) => k.openTime === Date.UTC(2024, 6, 23));
        expect([bar.open, bar.high, bar.low, bar.close]).toEqual([67532, 67750.98, 65111, 65376]);

        const closes = series(plots, 'time_close');
        expect(iso(closes.get(Date.UTC(2025, 11, 29)))).toBe('2025-12-31T00:00');
        expect(iso(closes.get(Date.UTC(2025, 11, 31)))).toBe('2026-01-01T00:00');
        expect(iso(closes.get(Date.UTC(2026, 0, 1)))).toBe('2026-01-03T00:00');

        const lastOf = (title: string) => [...series(plots, title).values()].at(-1);
        expect(lastOf('multiplier')).toBe(2);
        expect(lastOf('isdaily')).toBe(1);
        expect(lastOf('in_seconds')).toBe(172800);
        expect(lastOf('period 2D')).toBe(1);
    });

    it('builds 12M candles stamped with January 1 even when data starts later', async () => {
        const { plots, marketData } = await new PineTS(Provider.Mock, 'BTCUSDT', '12M', null, Date.UTC(2017, 7, 1), Date.UTC(2026, 0, 1)).run(
            `//@version=6\nindicator("12M")\n` + vars
        );
        expect(iso(marketData[0].openTime)).toBe('2017-01-01T00:00');
        expect(marketData[0].open).toBe(4261.48);
        const y2025 = marketData.find((k: Kline) => k.openTime === Date.UTC(2025, 0, 1));
        expect([y2025.high, y2025.low, y2025.close]).toEqual([126199.63, 74508, 87648.22]);
        expect(y2025.closeTime).toBe(Date.UTC(2026, 0, 1));

        const lastOf = (title: string) => [...series(plots, title).values()].at(-1);
        expect(lastOf('multiplier')).toBe(12);
        expect(lastOf('ismonthly')).toBe(1);
        expect(lastOf('in_seconds')).toBe(31536036);
        expect(lastOf('period 12M')).toBe(1);
    });

    it('writes timeframe.period with the multiplier in Pine v6 and without it in v5', async () => {
        const script = (version: number) => `//@version=${version}
indicator("period")
plot(timeframe.period == "D" ? 1 : 0, "D")
plot(timeframe.period == "1D" ? 1 : 0, "1D")`;
        const run = (version: number) => new PineTS(Provider.Mock, 'BTCUSDT', 'D', null, Date.UTC(2025, 0, 1), Date.UTC(2025, 0, 5)).run(script(version));
        const v6 = await run(6);
        const v5 = await run(5);
        expect([...series(v6.plots, '1D').values()].at(-1)).toBe(1);
        expect([...series(v6.plots, 'D').values()].at(-1)).toBe(0);
        expect([...series(v5.plots, 'D').values()].at(-1)).toBe(1);
        expect([...series(v5.plots, '1D').values()].at(-1)).toBe(0);
    });
});

describe('aggregateCandles on the calendar grid', () => {
    const hourly = (from: number, count: number): Kline[] =>
        Array.from({ length: count }, (_, i) => ({
            openTime: from + i * H,
            closeTime: from + (i + 1) * H,
            open: i,
            high: i + 0.5,
            low: i - 0.5,
            close: i + 0.25,
            volume: 1,
            quoteAssetVolume: 0,
            numberOfTrades: 0,
            takerBuyBaseAssetVolume: 0,
            takerBuyQuoteAssetVolume: 0,
            ignore: 0,
        }));

    it('restarts intraday grids at 00:00 UTC, so the last bar of the day is shorter', () => {
        // data starts mid-bar at 03:00; 300-minute bars are 00-05, 05-10, 10-15, 15-20, 20-24
        const bars = aggregateCandles(hourly(Date.UTC(2025, 0, 1, 3), 27), '300', '60', { calendarGrid: true });
        expect(bars.map((b) => `${iso(b.openTime).slice(11)}-${iso(b.closeTime).slice(11)}:${b.volume}`)).toEqual([
            '00:00-05:00:2',
            '05:00-10:00:5',
            '10:00-15:00:5',
            '15:00-20:00:5',
            '20:00-00:00:4',
            '00:00-05:00:5',
            '05:00-10:00:1',
        ]);
    });

    it('restarts week multiples at the first Monday of the year', () => {
        const days = hourly(Date.UTC(2024, 11, 16), 24 * 28).filter((k) => k.openTime % D === 0);
        const bars = aggregateCandles(days, '2W', 'D', { calendarGrid: true });
        expect(bars.map((b) => `${iso(b.openTime).slice(0, 10)}>${iso(b.closeTime).slice(0, 10)}`)).toEqual([
            '2024-12-16>2024-12-30',
            '2024-12-30>2025-01-06',
            '2025-01-06>2025-01-20',
        ]);
    });
});
