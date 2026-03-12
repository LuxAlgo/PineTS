/**
 * Tests for timezone-related fixes:
 * - Fix 1: closeTime normalization (provider-level + PineTS safety-net)
 * - Fix 2: time_tradingday uses closeTime instead of openTime
 * - Fix 3: setTimezone() is display-only (does not affect computation)
 */
import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

// ── Fix 1: closeTime normalization ──────────────────────────────────────

describe('closeTime normalization — provider-level (MockProvider)', () => {
    // MockProvider normalizes raw Binance closeTime (nextBarOpen - 1ms) to TV convention (nextBarOpen).
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null,
        new Date('2019-01-01').getTime(), new Date('2019-03-01').getTime());

    it('time_close matches TV convention (next bar openTime)', async () => {
        const sourceCode = `
//@version=6
indicator("CloseTime Test")
plot(time, "time")
plot(time_close, "time_close")
`;
        const { plots } = await pineTS.run(sourceCode);
        const _time = plots['time']?.data;
        const _tc = plots['time_close']?.data;

        // For each bar (except last), time_close should equal next bar's time
        for (let i = 0; i < _time.length - 1; i++) {
            expect(_tc[i].value).toBe(_time[i + 1].value);
        }
    });

    it('time_close is exactly 7 days after time for weekly bars', async () => {
        const sourceCode = `
//@version=6
indicator("CloseTime Delta Test")
plot(time, "time")
plot(time_close, "time_close")
`;
        const { plots } = await pineTS.run(sourceCode);
        const _time = plots['time']?.data;
        const _tc = plots['time_close']?.data;
        const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

        // For weekly crypto bars, closeTime - openTime = exactly 1 week
        for (let i = 0; i < _time.length; i++) {
            expect(_tc[i].value - _time[i].value).toBe(oneWeekMs);
        }
    });

    it('first bar closeTime matches TV value exactly', async () => {
        const sourceCode = `
//@version=6
indicator("CloseTime Exact Test")
plot(time_close, "time_close")
`;
        const { plots } = await pineTS.run(sourceCode);
        // First weekly bar: opens 2019-01-07, closes 2019-01-14 00:00 UTC
        expect(plots['time_close'].data[0].value).toBe(new Date('2019-01-14T00:00:00Z').getTime());
    });
});

describe('closeTime normalization — PineTS safety-net (array-based data)', () => {
    it('computes closeTime from openTime + timeframe when not provided', async () => {
        // Array-based data without closeTime
        const arrayData = [
            { openTime: 1546819200000, open: 3800, high: 3900, low: 3700, close: 3850, volume: 100 },
            { openTime: 1547424000000, open: 3850, high: 3950, low: 3750, close: 3900, volume: 110 },
            { openTime: 1548028800000, open: 3900, high: 4000, low: 3800, close: 3950, volume: 120 },
        ];

        const pineTS = new PineTS(arrayData, 'TEST', 'W');
        const { result } = await pineTS.run(($) => {
            const { time_close } = $.pine;
            let tc = time_close;
            return { tc };
        });

        // Safety-net: closeTime = openTime + 1W (604800000ms)
        const oneWeekMs = 604_800_000;
        expect(result.tc[0]).toBe(1546819200000 + oneWeekMs);
        expect(result.tc[1]).toBe(1547424000000 + oneWeekMs);
    });

    it('uses provider closeTime when available (no override)', async () => {
        // Array-based data WITH closeTime already set
        const arrayData = [
            { openTime: 1546819200000, open: 3800, high: 3900, low: 3700, close: 3850, volume: 100, closeTime: 1547424000000 },
            { openTime: 1547424000000, open: 3850, high: 3950, low: 3750, close: 3900, volume: 110, closeTime: 1548028800000 },
        ];

        const pineTS = new PineTS(arrayData, 'TEST', 'W');
        const { result } = await pineTS.run(($) => {
            const { time_close } = $.pine;
            let tc = time_close;
            return { tc };
        });

        // Should use provider-supplied closeTime, not compute from timeframe
        expect(result.tc[0]).toBe(1547424000000);
        expect(result.tc[1]).toBe(1548028800000);
    });

    it('defaults to 1D duration when timeframe is undefined', async () => {
        const arrayData = [
            { openTime: 1546819200000, open: 100, high: 110, low: 90, close: 105, volume: 50 },
        ];

        // No timeframe specified
        const pineTS = new PineTS(arrayData);
        const { result } = await pineTS.run(($) => {
            const { time_close } = $.pine;
            let tc = time_close;
            return { tc };
        });

        // Default: 1D = 86400000ms
        expect(result.tc[0]).toBe(1546819200000 + 86_400_000);
    });
});

// ── Fix 2: time_tradingday uses closeTime ──────────────────────────────

describe('time_tradingday — uses close date (TV-compatible)', () => {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null,
        new Date('2019-01-01').getTime(), new Date('2019-03-01').getTime());

    it('returns midnight UTC of the close date, not open date', async () => {
        const sourceCode = `
//@version=6
indicator("TradingDay Test")
plot(time, "time")
plot(time_tradingday, "td")
`;
        const { plots } = await pineTS.run(sourceCode);
        const _time = plots['time']?.data;
        const _td = plots['td']?.data;

        // First bar opens 2019-01-07, closes 2019-01-14
        // time_tradingday should be midnight of 2019-01-14
        expect(_td[0].value).toBe(Date.UTC(2019, 0, 14, 0, 0, 0));
        // NOT the open date
        expect(_td[0].value).not.toBe(_time[0].value);
    });

    it('time_tradingday equals midnight of closeTime date for each bar', async () => {
        const sourceCode = `
//@version=6
indicator("TradingDay All Bars")
plot(time_close, "tc")
plot(time_tradingday, "td")
`;
        const { plots } = await pineTS.run(sourceCode);
        const _tc = plots['tc']?.data;
        const _td = plots['td']?.data;

        for (let i = 0; i < _tc.length; i++) {
            // closeTime → get date → midnight of that date
            const closeDate = new Date(_tc[i].value);
            const expectedTD = Date.UTC(closeDate.getUTCFullYear(), closeDate.getUTCMonth(), closeDate.getUTCDate(), 0, 0, 0);
            expect(_td[i].value).toBe(expectedTD);
        }
    });

    it('matches TV values for multiple weeks (validated against TradingView)', async () => {
        const sourceCode = `
//@version=6
indicator("TD TV Comparison")
plot(time_tradingday, "td")
`;
        const { plots } = await pineTS.run(sourceCode);
        const tdData = plots['td']?.data;

        // TV expected values for BTCUSDC Weekly, chart timezone UTC:
        // Bar opens 2019-01-07 → time_tradingday = 2019-01-14 00:00 UTC = 1547424000000
        // Bar opens 2019-01-14 → time_tradingday = 2019-01-21 00:00 UTC = 1548028800000
        // Bar opens 2019-01-21 → time_tradingday = 2019-01-28 00:00 UTC = 1548633600000
        // Bar opens 2019-01-28 → time_tradingday = 2019-02-04 00:00 UTC = 1549238400000
        expect(tdData[0].value).toBe(1547424000000);
        expect(tdData[1].value).toBe(1548028800000);
        expect(tdData[2].value).toBe(1548633600000);
        expect(tdData[3].value).toBe(1549238400000);
    });
});

// ── Fix 3: setTimezone() is display-only ────────────────────────────────

describe('setTimezone() — display-only behavior (does not change computation)', () => {

    it('hour and dayofmonth are unchanged by setTimezone()', async () => {
        // Run without setTimezone
        const pineTSDefault = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null,
            new Date('2019-01-01').getTime(), new Date('2019-02-01').getTime());

        // Run with setTimezone
        const pineTSWithTZ = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null,
            new Date('2019-01-01').getTime(), new Date('2019-02-01').getTime());
        pineTSWithTZ.setTimezone('America/New_York');

        const sourceCode = `
//@version=6
indicator("TZ Test")
plot(hour, "hour")
plot(dayofmonth, "dom")
`;
        const { plots: plotsDefault } = await pineTSDefault.run(sourceCode);
        const { plots: plotsWithTZ } = await pineTSWithTZ.run(sourceCode);

        // All computation values should be identical
        for (let i = 0; i < plotsDefault['hour'].data.length; i++) {
            expect(plotsWithTZ['hour'].data[i].value).toBe(plotsDefault['hour'].data[i].value);
            expect(plotsWithTZ['dom'].data[i].value).toBe(plotsDefault['dom'].data[i].value);
        }
    });

    it('timestamp() is unchanged by setTimezone()', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null,
            new Date('2019-01-01').getTime(), new Date('2019-02-01').getTime());
        pineTS.setTimezone('UTC-5');

        const sourceCode = `
//@version=6
indicator("TZ Test")
ts = timestamp("2019-06-10 00:00")
plot(ts, "ts")
`;
        const { plots } = await pineTS.run(sourceCode);
        // Should resolve in exchange timezone (UTC), NOT chart timezone (UTC-5)
        expect(plots['ts'].data[0].value).toBe(1560124800000); // 2019-06-10 00:00 UTC
    });

    it('time_tradingday is unchanged by setTimezone()', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null,
            new Date('2019-01-01').getTime(), new Date('2019-02-01').getTime());
        pineTS.setTimezone('UTC+8');

        const sourceCode = `
//@version=6
indicator("TZ Test")
plot(time_tradingday, "td")
`;
        const { plots } = await pineTS.run(sourceCode);
        // time_tradingday uses syminfo.timezone (UTC), not chart timezone
        // First bar opens 2019-01-07, closes 2019-01-14 → TD = midnight Jan 14
        expect(plots['td'].data[0].value).toBe(Date.UTC(2019, 0, 14, 0, 0, 0));
    });

    it('weekofyear, month, year unchanged by setTimezone()', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null,
            new Date('2019-01-01').getTime(), new Date('2019-02-01').getTime());
        pineTS.setTimezone('Asia/Tokyo'); // UTC+9

        const sourceCode = `
//@version=6
indicator("TZ Test")
plot(weekofyear, "woy")
plot(month, "month")
plot(year, "year")
`;
        const { plots } = await pineTS.run(sourceCode);
        // Bar opens 2019-01-07 00:00 UTC — computation uses exchange TZ (UTC)
        expect(plots['woy'].data[0].value).toBe(2);
        expect(plots['month'].data[0].value).toBe(1);
        expect(plots['year'].data[0].value).toBe(2019);
    });
});

// ── closeTime normalization end-to-end (TV values) ──────────────────────

describe('closeTime + time_close — TV-validated values', () => {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null,
        new Date('2019-01-01').getTime(), new Date('2019-04-01').getTime());

    it('time, time_close, time_tradingday match TradingView exactly', async () => {
        const sourceCode = `
//@version=6
indicator("TV Comparison")
plot(time, "time")
plot(time_close, "tc")
plot(time_tradingday, "td")
`;
        const { plots } = await pineTS.run(sourceCode);
        const _time = plots['time']?.data;
        const _tc = plots['tc']?.data;
        const _td = plots['td']?.data;

        // TV-validated values (BTCUSDC Weekly, UTC):
        // Bar 2019-01-07: time=1546819200000, time_close=1547424000000, time_tradingday=1547424000000
        // Bar 2019-01-14: time=1547424000000, time_close=1548028800000, time_tradingday=1548028800000
        // Bar 2019-01-21: time=1548028800000, time_close=1548633600000, time_tradingday=1548633600000
        const expectedBars = [
            { time: 1546819200000, tc: 1547424000000, td: 1547424000000 },
            { time: 1547424000000, tc: 1548028800000, td: 1548028800000 },
            { time: 1548028800000, tc: 1548633600000, td: 1548633600000 },
            { time: 1548633600000, tc: 1549238400000, td: 1549238400000 },
            { time: 1549238400000, tc: 1549843200000, td: 1549843200000 },
            { time: 1549843200000, tc: 1550448000000, td: 1550448000000 },
            { time: 1550448000000, tc: 1551052800000, td: 1551052800000 },
            { time: 1551052800000, tc: 1551657600000, td: 1551657600000 },
            { time: 1551657600000, tc: 1552262400000, td: 1552262400000 },
            { time: 1552262400000, tc: 1552867200000, td: 1552867200000 },
            { time: 1552867200000, tc: 1553472000000, td: 1553472000000 },
            { time: 1553472000000, tc: 1554076800000, td: 1554076800000 },
        ];

        for (let i = 0; i < expectedBars.length; i++) {
            expect(_time[i].value).toBe(expectedBars[i].time);
            expect(_tc[i].value).toBe(expectedBars[i].tc);
            expect(_td[i].value).toBe(expectedBars[i].td);
        }
    });
});
