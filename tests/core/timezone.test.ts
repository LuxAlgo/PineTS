import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

// BTCUSDC Weekly — data range covers 2018-12-10 to 2019-06-30
// Weekly bars start on Mondays. First bar in range: 2018-12-10 (Mon)

describe('Timezone — timestamp(dateString) in UTC', () => {
    // TV expected values (chart timezone: UTC, BTCUSDC Weekly):
    // timestamp("2019-06-10 00:00") = 1560124800000 (UTC midnight)
    // timestamp(2019, 6, 10, 0, 0, 0) = 1560124800000
    // timestamp("America/New_York", 2019, 6, 10, 0, 0, 0) = 1560139200000 (EDT midnight = UTC+4h)

    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-06-30').getTime());

    it('timestamp(dateString) resolves to UTC when chart timezone is UTC', async () => {
        const sourceCode = `
//@version=6
indicator("Timezone Test")
ts = timestamp("2019-06-10 00:00")
plot(ts, "ts")
`;
        const { plots } = await pineTS.run(sourceCode);
        const tsData = plots['ts']?.data;
        // All bars should produce the same constant value
        expect(tsData[0].value).toBe(1560124800000);
    });

    it('timestamp(year, month, day) matches timestamp(dateString) in UTC', async () => {
        const sourceCode = `
//@version=6
indicator("Timezone Test")
ts1 = timestamp("2019-06-10 00:00")
ts2 = timestamp(2019, 6, 10, 0, 0, 0)
plot(ts1, "ts1")
plot(ts2, "ts2")
`;
        const { plots } = await pineTS.run(sourceCode);
        expect(plots['ts1'].data[0].value).toBe(plots['ts2'].data[0].value);
        expect(plots['ts1'].data[0].value).toBe(1560124800000);
    });

    it('timestamp with explicit IANA timezone offsets correctly', async () => {
        const sourceCode = `
//@version=6
indicator("Timezone Test")
ts = timestamp("America/New_York", 2019, 6, 10, 0, 0, 0)
plot(ts, "ts")
`;
        const { plots } = await pineTS.run(sourceCode);
        // Midnight in America/New_York (EDT, UTC-4 in June) = 04:00 UTC
        expect(plots['ts'].data[0].value).toBe(1560139200000);
    });
});

describe('Timezone — time component functions in UTC (validated against TradingView)', () => {
    // TV data: BTCUSDC Weekly, chart timezone UTC
    // Bar 2019-01-07: hour=0, dayofmonth=7, dayofweek=2(Mon), month=1, year=2019, weekofyear=2
    // Bar 2019-02-04: hour=0, dayofmonth=4, dayofweek=2(Mon), month=2, year=2019, weekofyear=6
    // Bar 2019-03-04: hour=0, dayofmonth=4, dayofweek=2(Mon), month=3, year=2019, weekofyear=10

    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-04-01').getTime());

    it('hour, dayofmonth, dayofweek, month, year, weekofyear match TradingView', async () => {
        const sourceCode = `
//@version=6
indicator("Time Components Test")
plot(hour, "hour")
plot(dayofmonth, "dom")
plot(dayofweek, "dow")
plot(month, "month")
plot(year, "year")
plot(weekofyear, "woy")
`;
        const { plots } = await pineTS.run(sourceCode);
        const _hour = plots['hour']?.data;
        const _dom = plots['dom']?.data;
        const _dow = plots['dow']?.data;
        const _month = plots['month']?.data;
        const _year = plots['year']?.data;
        const _woy = plots['woy']?.data;

        const startDate = new Date('2019-01-07').getTime();
        const endDate = new Date('2019-03-25').getTime();

        let plotdata_str = '';
        for (let i = 0; i < _hour.length; i++) {
            const time = _hour[i].time;
            if (time < startDate || time > endDate) continue;
            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            plotdata_str += `[${str_time}]: ${_hour[i].value} ${_dom[i].value} ${_dow[i].value} ${_month[i].value} ${_year[i].value} ${_woy[i].value}\n`;
        }

        // Expected from TradingView (BTCUSDC Weekly, UTC timezone)
        // Format: hour dayofmonth dayofweek month year weekofyear
        const expected_plot = `[2019-01-07T00:00:00.000-00:00]: 0 7 2 1 2019 2
[2019-01-14T00:00:00.000-00:00]: 0 14 2 1 2019 3
[2019-01-21T00:00:00.000-00:00]: 0 21 2 1 2019 4
[2019-01-28T00:00:00.000-00:00]: 0 28 2 1 2019 5
[2019-02-04T00:00:00.000-00:00]: 0 4 2 2 2019 6
[2019-02-11T00:00:00.000-00:00]: 0 11 2 2 2019 7
[2019-02-18T00:00:00.000-00:00]: 0 18 2 2 2019 8
[2019-02-25T00:00:00.000-00:00]: 0 25 2 2 2019 9
[2019-03-04T00:00:00.000-00:00]: 0 4 2 3 2019 10
[2019-03-11T00:00:00.000-00:00]: 0 11 2 3 2019 11
[2019-03-18T00:00:00.000-00:00]: 0 18 2 3 2019 12
[2019-03-25T00:00:00.000-00:00]: 0 25 2 3 2019 13`;

        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });
});

describe('Timezone — setTimezone() does NOT change computation (display-only)', () => {
    // TradingView behavior: changing chart timezone on crypto (BTCUSDC) has zero effect
    // on Pine Script computation functions (hour, dayofmonth, timestamp, etc.).
    // All functions use syminfo.timezone (= Etc/UTC for crypto).
    // setTimezone() only changes log timestamp display formatting.

    it('hour and dayofmonth stay in exchange timezone (UTC) when chart TZ is UTC+5', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-02-01').getTime());
        pineTS.setTimezone('UTC+5');

        const sourceCode = `
//@version=6
indicator("TZ Test")
plot(hour, "hour")
plot(dayofmonth, "dom")
`;
        const { plots } = await pineTS.run(sourceCode);
        // Bar at 2019-01-07 00:00 UTC — computation uses exchange TZ (UTC), NOT chart TZ
        expect(plots['hour'].data[0].value).toBe(0);
        expect(plots['dom'].data[0].value).toBe(7);
    });

    it('hour and dayofmonth stay in exchange timezone (UTC) when chart TZ is UTC-5', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-02-01').getTime());
        pineTS.setTimezone('UTC-5');

        const sourceCode = `
//@version=6
indicator("TZ Test")
plot(hour, "hour")
plot(dayofmonth, "dom")
`;
        const { plots } = await pineTS.run(sourceCode);
        // Computation still uses exchange TZ (UTC), chart TZ is display-only
        expect(plots['hour'].data[0].value).toBe(0);
        expect(plots['dom'].data[0].value).toBe(7);
    });

    it('IANA chart timezone does not affect computation', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-04-01').getTime());
        pineTS.setTimezone('America/New_York');

        const sourceCode = `
//@version=6
indicator("TZ Test")
plot(hour, "hour")
`;
        const { plots } = await pineTS.run(sourceCode);
        // Jan 7: exchange is UTC → hour = 0 regardless of chart TZ
        expect(plots['hour'].data[0].value).toBe(0);
    });
});

describe('Timezone — timestamp(dateString) with non-UTC chart timezone', () => {
    it('timestamp(dateString) always uses exchange timezone, ignoring chart timezone', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-02-01').getTime());
        pineTS.setTimezone('America/New_York');

        const sourceCode = `
//@version=6
indicator("TZ Test")
ts = timestamp("2019-06-10 00:00")
plot(ts, "ts")
`;
        const { plots } = await pineTS.run(sourceCode);
        // "2019-06-10 00:00" resolves in exchange timezone (UTC), NOT chart timezone
        // = 2019-06-10 00:00 UTC = 1560124800000
        expect(plots['ts'].data[0].value).toBe(1560124800000);
    });

    it('timestamp with explicit timezone arg works regardless of chart timezone', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-02-01').getTime());
        pineTS.setTimezone('America/New_York');

        const sourceCode = `
//@version=6
indicator("TZ Test")
ts = timestamp("UTC", 2019, 6, 10, 0, 0, 0)
plot(ts, "ts")
`;
        const { plots } = await pineTS.run(sourceCode);
        // Explicit "UTC" arg always uses UTC
        expect(plots['ts'].data[0].value).toBe(1560124800000);
    });
});
