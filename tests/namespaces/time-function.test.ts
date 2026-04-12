import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

// Mock provider has daily data. Use daily chart with higher TF alignment tests.
// For intraday tests, use Binance provider.

describe('time() function — timeframe alignment (daily chart)', () => {
    // Mock data: daily bars from 2025-01-01 to 2025-06-01
    const makePineTS = () => new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-06-01').getTime());

    it('time("W") returns weekly-aligned timestamps on daily chart', async () => {
        const code = `
//@version=5
indicator("time W test")
t_w = time("W")
t_bar = time
plot(t_w, "weekly")
plot(t_bar, "bar")
`;
        const pineTS = makePineTS();
        const { plots } = await pineTS.run(code);

        const weeklyData = plots['weekly'].data.filter((d: any) => d.value != null && !isNaN(d.value));
        expect(weeklyData.length).toBeGreaterThan(0);

        // Weekly timestamps should be on Mondays at 00:00 UTC
        for (const d of weeklyData) {
            const date = new Date(d.value);
            expect(date.getUTCDay()).toBe(1); // Monday
            expect(date.getUTCHours()).toBe(0);
            expect(date.getUTCMinutes()).toBe(0);
        }

        // Should be a staircase: same value for 7 consecutive daily bars
        let sameCount = 0;
        for (let i = 1; i < weeklyData.length; i++) {
            if (weeklyData[i].value === weeklyData[i - 1].value) sameCount++;
        }
        // Most daily bars within the same week should have the same weekly timestamp
        expect(sameCount).toBeGreaterThan(weeklyData.length * 0.7);
    });

    it('time("M") returns monthly-aligned timestamps on daily chart', async () => {
        const code = `
//@version=5
indicator("time M test")
t_m = time("M")
plot(t_m, "monthly")
`;
        const pineTS = makePineTS();
        const { plots } = await pineTS.run(code);

        const monthlyData = plots['monthly'].data.filter((d: any) => d.value != null && !isNaN(d.value));
        expect(monthlyData.length).toBeGreaterThan(0);

        // Monthly timestamps should be on the 1st at 00:00 UTC
        for (const d of monthlyData) {
            const date = new Date(d.value);
            expect(date.getUTCDate()).toBe(1);
            expect(date.getUTCHours()).toBe(0);
            expect(date.getUTCMinutes()).toBe(0);
        }

        // Should have ~5 unique monthly values for Jan-May
        const uniqueMonths = new Set(monthlyData.map((d: any) => d.value));
        expect(uniqueMonths.size).toBeGreaterThanOrEqual(4);
        expect(uniqueMonths.size).toBeLessThanOrEqual(6);
    });

    it('time("D") on daily chart returns same as time variable', async () => {
        const code = `
//@version=5
indicator("time D on D test")
t_d = time("D")
t_bar = time
plot(t_d, "daily_fn")
plot(t_bar, "bar")
`;
        const pineTS = makePineTS();
        const { plots } = await pineTS.run(code);

        const dailyFnData = plots['daily_fn'].data;
        const barData = plots['bar'].data;

        // On a daily chart, time("D") should equal time
        let checked = 0;
        for (let i = 0; i < dailyFnData.length; i++) {
            if (dailyFnData[i].value != null && barData[i].value != null) {
                expect(dailyFnData[i].value).toBe(barData[i].value);
                checked++;
            }
        }
        expect(checked).toBeGreaterThan(0);
    });

    it('time("") returns current bar time', async () => {
        const code = `
//@version=5
indicator("time empty test")
t_empty = time("")
t_bar = time
plot(t_empty, "empty")
plot(t_bar, "bar")
`;
        const pineTS = makePineTS();
        const { plots } = await pineTS.run(code);

        const emptyData = plots['empty'].data;
        const barData = plots['bar'].data;

        let checked = 0;
        for (let i = 0; i < emptyData.length; i++) {
            if (emptyData[i].value != null && barData[i].value != null) {
                expect(emptyData[i].value).toBe(barData[i].value);
                checked++;
            }
        }
        expect(checked).toBeGreaterThan(0);
    });

    it('time("W") steps at week boundaries', async () => {
        const code = `
//@version=5
indicator("time W boundary test")
t_w = time("W")
plot(t_w, "weekly")
`;
        const pineTS = makePineTS();
        const { plots } = await pineTS.run(code);

        const weeklyData = plots['weekly'].data.filter((d: any) => d.value != null && !isNaN(d.value));
        const uniqueWeeks = [...new Set(weeklyData.map((d: any) => d.value))].sort((a: number, b: number) => a - b);

        // Each unique week should be 7 days apart
        for (let i = 1; i < uniqueWeeks.length; i++) {
            expect(uniqueWeeks[i] - uniqueWeeks[i - 1]).toBe(7 * 86400000);
        }
    });
});

describe('time() function — intraday alignment (Binance)', () => {
    // Use Binance 15min data for intraday timeframe tests
    const makePineTS = () => new PineTS(Provider.Binance, 'BTCUSDC', '15', 200);

    it('time("D") returns daily-aligned timestamps on 15min chart', async () => {
        const code = `
//@version=5
indicator("time D on 15m")
t_d = time("D")
t_bar = time
plot(t_d, "daily")
plot(t_bar, "bar")
`;
        const pineTS = makePineTS();
        const { plots } = await pineTS.run(code);

        const dailyData = plots['daily'].data;
        const barData = plots['bar'].data;

        // Daily time should be staircase: same for all bars in a day
        let stairFound = false;
        for (let i = 1; i < dailyData.length; i++) {
            const d1 = dailyData[i - 1].value;
            const d2 = dailyData[i].value;
            const b1 = barData[i - 1].value;
            const b2 = barData[i].value;
            if (d1 == null || d2 == null || b1 == null || b2 == null) continue;

            // Bar times always increase
            expect(b2).toBeGreaterThan(b1);

            // Within same day, daily should be constant
            if (d2 === d1 && b2 > b1) stairFound = true;
        }
        expect(stairFound).toBe(true);

        // All daily values should be at 00:00 UTC
        for (const d of dailyData) {
            if (d.value != null && !isNaN(d.value)) {
                const date = new Date(d.value);
                expect(date.getUTCHours()).toBe(0);
                expect(date.getUTCMinutes()).toBe(0);
            }
        }
    });

    it('time("60") returns hourly-aligned timestamps on 15min chart', async () => {
        const code = `
//@version=5
indicator("time 60 on 15m")
t_h = time("60")
plot(t_h, "hourly")
`;
        const pineTS = makePineTS();
        const { plots } = await pineTS.run(code);

        const hourlyData = plots['hourly'].data;

        // Hourly timestamps should be at :00 minutes
        for (const d of hourlyData) {
            if (d.value != null && !isNaN(d.value)) {
                const date = new Date(d.value);
                expect(date.getUTCMinutes()).toBe(0);
            }
        }

        // With 15min bars, each hourly value repeats 4 times then steps
        let sameCount = 0, stepCount = 0;
        for (let i = 1; i < hourlyData.length; i++) {
            if (hourlyData[i].value == null || hourlyData[i - 1].value == null) continue;
            if (hourlyData[i].value === hourlyData[i - 1].value) sameCount++;
            else stepCount++;
        }
        // ~75% same, ~25% step (3 same per 1 step)
        expect(sameCount).toBeGreaterThan(stepCount * 2);
    });

    it('time("240") returns 4h-aligned timestamps on 15min chart', async () => {
        const code = `
//@version=5
indicator("time 240 on 15m")
t_4h = time("240")
plot(t_4h, "4h")
`;
        const pineTS = makePineTS();
        const { plots } = await pineTS.run(code);

        const fourHData = plots['4h'].data;

        // 4h timestamps should have hours at 0, 4, 8, 12, 16, or 20
        for (const d of fourHData) {
            if (d.value != null && !isNaN(d.value)) {
                const date = new Date(d.value);
                expect(date.getUTCHours() % 4).toBe(0);
                expect(date.getUTCMinutes()).toBe(0);
            }
        }
    });
});

describe('time() function — session filtering', () => {
    const makePineTS = () => new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-02-01').getTime());

    it('time with session returns NaN outside session hours', async () => {
        // On daily bars, session "0800-1600" should filter based on the bar's time
        // Since mock daily bars have openTime at 00:00 UTC, they fall outside 08:00-16:00
        // This tests the session filtering mechanism
        const code = `
//@version=5
indicator("time session test")
t_in = time("D", "0000-2359")
t_out = time("D", "0100-0200")
plot(t_in, "in_session")
plot(t_out, "out_session")
`;
        const pineTS = makePineTS();
        const { plots } = await pineTS.run(code);

        const inData = plots['in_session'].data;
        const outData = plots['out_session'].data;

        // 0000-2359 should include all bars (daily bars at 00:00 UTC are in 00:00-23:59)
        const validIn = inData.filter((d: any) => d.value != null && !isNaN(d.value));
        expect(validIn.length).toBeGreaterThan(0);

        // 0100-0200 should exclude daily bars at 00:00 UTC
        const validOut = outData.filter((d: any) => d.value != null && !isNaN(d.value));
        const nanOut = outData.filter((d: any) => d.value == null || isNaN(d.value));
        expect(nanOut.length).toBeGreaterThan(0);
    });
});
