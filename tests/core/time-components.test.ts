import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

// BTCUSDC weekly bars starting 2019-01-07 (Monday)
// First bar openTime: 1546819200000 = 2019-01-07 00:00:00 UTC
const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-02-01').getTime());

// Pre-computed values for 2019-01-07 00:00:00 UTC (Monday)
// dayofmonth: 7
// dayofweek: 2 (Pine: Mon=2)
// hour: 0
// minute: 0
// month: 1
// second: 0
// weekofyear: 2 (ISO week 2 of 2019)
// year: 2019

describe('dayofmonth', () => {
    it('bare identifier returns day of month for first bar', async () => {
        const { result } = await pineTS.run(($) => {
            const { dayofmonth } = $.pine;
            let d = dayofmonth;
            return { d };
        });
        expect(result.d[0]).toBe(7);
    });

    it('function call with timestamp arg', async () => {
        const { result } = await pineTS.run(($) => {
            const { dayofmonth } = $.pine;
            let d = dayofmonth(1546819200000);
            return { d };
        });
        expect(result.d[0]).toBe(7);
    });

    it('function call with timestamp + timezone', async () => {
        const { result } = await pineTS.run(($) => {
            const { dayofmonth } = $.pine;
            // UTC+5 → 2019-01-07 05:00 → still day 7
            let d = dayofmonth(1546819200000, 'UTC+5');
            return { d };
        });
        expect(result.d[0]).toBe(7);
    });

    it('Pine Script string syntax', async () => {
        const code = `
//@version=5
indicator("DayOfMonth Test")
d = dayofmonth
plot(d, "dom")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['dom']).toBeDefined();
        expect(plots['dom'].data[0].value).toBe(7);
    });
});

describe('dayofweek', () => {
    it('bare identifier returns Pine dayofweek for first bar (Monday=2)', async () => {
        const { result } = await pineTS.run(($) => {
            const { dayofweek } = $.pine;
            let d = dayofweek;
            return { d };
        });
        expect(result.d[0]).toBe(2); // Monday
    });

    it('function call with timestamp arg', async () => {
        const { result } = await pineTS.run(($) => {
            const { dayofweek } = $.pine;
            let d = dayofweek(1546819200000);
            return { d };
        });
        expect(result.d[0]).toBe(2); // Monday
    });

    it('function call with timestamp + timezone', async () => {
        const { result } = await pineTS.run(($) => {
            const { dayofweek } = $.pine;
            let d = dayofweek(1546819200000, 'UTC');
            return { d };
        });
        expect(result.d[0]).toBe(2); // Monday
    });

    it('enum constants accessible', async () => {
        const { result } = await pineTS.run(($) => {
            const { dayofweek } = $.pine;
            let sun = dayofweek.sunday;
            let mon = dayofweek.monday;
            let tue = dayofweek.tuesday;
            let wed = dayofweek.wednesday;
            let thu = dayofweek.thursday;
            let fri = dayofweek.friday;
            let sat = dayofweek.saturday;
            return { sun, mon, tue, wed, thu, fri, sat };
        });
        const last = result.sun.length - 1;
        expect(result.sun[last]).toBe(1);
        expect(result.mon[last]).toBe(2);
        expect(result.tue[last]).toBe(3);
        expect(result.wed[last]).toBe(4);
        expect(result.thu[last]).toBe(5);
        expect(result.fri[last]).toBe(6);
        expect(result.sat[last]).toBe(7);
    });

    it('Pine Script string syntax', async () => {
        const code = `
//@version=5
indicator("DayOfWeek Test")
d = dayofweek
plot(d, "dow")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['dow']).toBeDefined();
        expect(plots['dow'].data[0].value).toBe(2); // Monday
    });
});

describe('hour', () => {
    it('bare identifier returns hour for first bar', async () => {
        const { result } = await pineTS.run(($) => {
            const { hour } = $.pine;
            let h = hour;
            return { h };
        });
        expect(result.h[0]).toBe(0); // 00:00 UTC
    });

    it('function call with timestamp arg', async () => {
        const { result } = await pineTS.run(($) => {
            const { hour } = $.pine;
            let h = hour(1546819200000);
            return { h };
        });
        expect(result.h[0]).toBe(0);
    });

    it('function call with timestamp + timezone', async () => {
        const { result } = await pineTS.run(($) => {
            const { hour } = $.pine;
            // UTC+5 → 05:00
            let h = hour(1546819200000, 'UTC+5');
            return { h };
        });
        expect(result.h[0]).toBe(5);
    });

    it('Pine Script string syntax', async () => {
        const code = `
//@version=5
indicator("Hour Test")
h = hour
plot(h, "hour")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['hour']).toBeDefined();
        expect(plots['hour'].data[0].value).toBe(0);
    });
});

describe('minute', () => {
    it('bare identifier returns minute for first bar', async () => {
        const { result } = await pineTS.run(($) => {
            const { minute } = $.pine;
            let m = minute;
            return { m };
        });
        expect(result.m[0]).toBe(0);
    });

    it('function call with timestamp arg', async () => {
        const { result } = await pineTS.run(($) => {
            const { minute } = $.pine;
            // 1546819200000 + 30*60*1000 = +30 minutes
            let m = minute(1546819200000 + 30 * 60 * 1000);
            return { m };
        });
        expect(result.m[0]).toBe(30);
    });

    it('function call with timestamp + timezone', async () => {
        const { result } = await pineTS.run(($) => {
            const { minute } = $.pine;
            // UTC+05:30 offset doesn't change minutes of a round hour
            let m = minute(1546819200000, 'UTC+5');
            return { m };
        });
        expect(result.m[0]).toBe(0);
    });

    it('Pine Script string syntax', async () => {
        const code = `
//@version=5
indicator("Minute Test")
m = minute
plot(m, "minute")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['minute']).toBeDefined();
        expect(plots['minute'].data[0].value).toBe(0);
    });
});

describe('month', () => {
    it('bare identifier returns month for first bar', async () => {
        const { result } = await pineTS.run(($) => {
            const { month } = $.pine;
            let m = month;
            return { m };
        });
        expect(result.m[0]).toBe(1); // January
    });

    it('function call with timestamp arg', async () => {
        const { result } = await pineTS.run(($) => {
            const { month } = $.pine;
            let m = month(1546819200000);
            return { m };
        });
        expect(result.m[0]).toBe(1);
    });

    it('function call with timestamp + timezone', async () => {
        const { result } = await pineTS.run(($) => {
            const { month } = $.pine;
            let m = month(1546819200000, 'UTC');
            return { m };
        });
        expect(result.m[0]).toBe(1);
    });

    it('Pine Script string syntax', async () => {
        const code = `
//@version=5
indicator("Month Test")
m = month
plot(m, "month")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['month']).toBeDefined();
        expect(plots['month'].data[0].value).toBe(1);
    });
});

describe('second', () => {
    it('bare identifier returns second for first bar', async () => {
        const { result } = await pineTS.run(($) => {
            const { second } = $.pine;
            let s = second;
            return { s };
        });
        expect(result.s[0]).toBe(0);
    });

    it('function call with timestamp arg', async () => {
        const { result } = await pineTS.run(($) => {
            const { second } = $.pine;
            // +45 seconds
            let s = second(1546819200000 + 45 * 1000);
            return { s };
        });
        expect(result.s[0]).toBe(45);
    });

    it('function call with timestamp + timezone', async () => {
        const { result } = await pineTS.run(($) => {
            const { second } = $.pine;
            // Timezone doesn't affect seconds
            let s = second(1546819200000 + 45 * 1000, 'UTC+5');
            return { s };
        });
        expect(result.s[0]).toBe(45);
    });

    it('Pine Script string syntax', async () => {
        const code = `
//@version=5
indicator("Second Test")
s = second
plot(s, "second")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['second']).toBeDefined();
        expect(plots['second'].data[0].value).toBe(0);
    });
});

describe('weekofyear', () => {
    it('bare identifier returns ISO week number for first bar', async () => {
        const { result } = await pineTS.run(($) => {
            const { weekofyear } = $.pine;
            let w = weekofyear;
            return { w };
        });
        // 2019-01-07 is ISO week 2
        expect(result.w[0]).toBe(2);
    });

    it('function call with timestamp arg', async () => {
        const { result } = await pineTS.run(($) => {
            const { weekofyear } = $.pine;
            let w = weekofyear(1546819200000);
            return { w };
        });
        expect(result.w[0]).toBe(2);
    });

    it('function call with timestamp + timezone', async () => {
        const { result } = await pineTS.run(($) => {
            const { weekofyear } = $.pine;
            let w = weekofyear(1546819200000, 'UTC');
            return { w };
        });
        expect(result.w[0]).toBe(2);
    });

    it('Pine Script string syntax', async () => {
        const code = `
//@version=5
indicator("WeekOfYear Test")
w = weekofyear
plot(w, "woy")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['woy']).toBeDefined();
        expect(plots['woy'].data[0].value).toBe(2);
    });
});

describe('year', () => {
    it('bare identifier returns year for first bar', async () => {
        const { result } = await pineTS.run(($) => {
            const { year } = $.pine;
            let y = year;
            return { y };
        });
        expect(result.y[0]).toBe(2019);
    });

    it('function call with timestamp arg', async () => {
        const { result } = await pineTS.run(($) => {
            const { year } = $.pine;
            let y = year(1546819200000);
            return { y };
        });
        expect(result.y[0]).toBe(2019);
    });

    it('function call with timestamp + timezone', async () => {
        const { result } = await pineTS.run(($) => {
            const { year } = $.pine;
            let y = year(1546819200000, 'UTC');
            return { y };
        });
        expect(result.y[0]).toBe(2019);
    });

    it('Pine Script string syntax', async () => {
        const code = `
//@version=5
indicator("Year Test")
y = year
plot(y, "year")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['year']).toBeDefined();
        expect(plots['year'].data[0].value).toBe(2019);
    });
});

describe('time_tradingday', () => {
    it('returns midnight UTC of the close date (trading day the bar settles)', async () => {
        const { result } = await pineTS.run(($) => {
            const { time_tradingday } = $.pine;
            let td = time_tradingday;
            return { td };
        });
        // Weekly bar opens 2019-01-07, closes (= next bar open) 2019-01-14.
        // TradingView returns 00:00 UTC of the close date → 2019-01-14
        expect(result.td[0]).toBe(Date.UTC(2019, 0, 14, 0, 0, 0));
    });

    it('Pine Script string syntax', async () => {
        const code = `
//@version=5
indicator("TimeTradingDay Test")
td = time_tradingday
plot(td, "td")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['td']).toBeDefined();
        // Weekly bar opens 2019-01-07, closeTime = 2019-01-14 → time_tradingday = midnight 2019-01-14
        expect(plots['td'].data[0].value).toBe(Date.UTC(2019, 0, 14, 0, 0, 0));
    });
});
