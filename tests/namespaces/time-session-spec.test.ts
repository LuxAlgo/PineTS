import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

// Hourly mock data: bars open at HH:00 UTC, symbol timezone is Etc/UTC.
// Expected in/out-of-session values below are hand-derived from the Pine
// session-spec rules (TradingView docs): "HHMM-HHMM[,HHMM-HHMM...][:days]",
// days digits 1=Sunday..7=Saturday, overnight sessions belong to the day
// on which they END (the trading day).
describe('time() session spec parsing', () => {
    // 2024-01-01 is a Monday.
    const makePineTS = () =>
        new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01T00:00:00Z').getTime(), new Date('2024-01-15T00:00:00Z').getTime());

    it('day suffix does not disable session filtering (reported bug)', async () => {
        // Reported repro: hourly bars open at HH:00 UTC = (HH-5):00 in UTC-5.
        // No bar's open time ever falls inside 09:30-10:00, so EVERY bar must
        // be out of session. The bug made every bar in-session because the
        // ":1234567" suffix failed the HHMM-HHMM regex and passed through.
        const code = `
//@version=6
indicator("time() session days suffix", overlay = true)
inSession = not na(time(timeframe.period, "0930-1000:1234567", "UTC-5"))
plot(inSession ? 1 : 0, "inSession")
`;
        const pineTS = makePineTS();
        const { plots } = await pineTS.run(code);

        const data = plots['inSession'].data;
        expect(data.length).toBeGreaterThan(0);
        for (const d of data) {
            expect(d.value).toBe(0);
        }
    });

    it('day suffix filters by day of week (1=Sunday..7=Saturday)', async () => {
        // "0000-0800:2" → in-session only on Mondays between 00:00 and 08:00.
        const code = `
//@version=5
indicator("session day filter")
t = time(timeframe.period, "0000-0800:2", "UTC")
plot(na(t) ? 0 : 1, "in")
`;
        const pineTS = makePineTS();
        const { plots } = await pineTS.run(code);

        const data = plots['in'].data;
        expect(data.length).toBeGreaterThan(0);

        let inCount = 0;
        for (const d of data) {
            const date = new Date(d.time);
            const expected = date.getUTCDay() === 1 && date.getUTCHours() < 8 ? 1 : 0;
            expect(d.value).toBe(expected);
            if (d.value === 1) inCount++;
        }
        // Mondays Jan 1 and Jan 8 contribute 8 hourly bars each; the range end
        // is inclusive, so Monday Jan 15 contributes its 00:00 bar as well.
        expect(inCount).toBe(17);
    });

    it('supports comma-separated session windows', async () => {
        // Hours 0,1 and 5,6 are in-session; everything else is not.
        const code = `
//@version=5
indicator("session comma windows")
t = time(timeframe.period, "0000-0200,0500-0700", "UTC")
plot(na(t) ? 0 : 1, "in")
`;
        const pineTS = makePineTS();
        const { plots } = await pineTS.run(code);

        const data = plots['in'].data;
        expect(data.length).toBeGreaterThan(0);

        for (const d of data) {
            const h = new Date(d.time).getUTCHours();
            const expected = h === 0 || h === 1 || h === 5 || h === 6 ? 1 : 0;
            expect(d.value).toBe(expected);
        }
    });

    it('supports overnight sessions crossing midnight', async () => {
        // "2200-0200" → hours 22, 23, 0, 1 in-session.
        const code = `
//@version=5
indicator("overnight session")
t = time(timeframe.period, "2200-0200", "UTC")
plot(na(t) ? 0 : 1, "in")
`;
        const pineTS = makePineTS();
        const { plots } = await pineTS.run(code);

        const data = plots['in'].data;
        expect(data.length).toBeGreaterThan(0);

        for (const d of data) {
            const h = new Date(d.time).getUTCHours();
            const expected = h >= 22 || h < 2 ? 1 : 0;
            expect(d.value).toBe(expected);
        }
    });

    it('overnight session day suffix refers to the trading day the session ends on', async () => {
        // "2200-0200:2" (Monday trading day) → Sunday 22:00/23:00 and Monday 00:00/01:00.
        const code = `
//@version=5
indicator("overnight session trading day")
t = time(timeframe.period, "2200-0200:2", "UTC")
plot(na(t) ? 0 : 1, "in")
`;
        const pineTS = makePineTS();
        const { plots } = await pineTS.run(code);

        const data = plots['in'].data;
        expect(data.length).toBeGreaterThan(0);

        for (const d of data) {
            const date = new Date(d.time);
            const day = date.getUTCDay(); // 0=Sun, 1=Mon
            const h = date.getUTCHours();
            const expected = (day === 0 && h >= 22) || (day === 1 && h < 2) ? 1 : 0;
            expect(d.value).toBe(expected);
        }
    });

    it('treats "HHMM-0000" end as end-of-day midnight', async () => {
        // "2200-0000" → hours 22, 23 in-session (same-day evening window).
        const code = `
//@version=5
indicator("midnight end session")
t = time(timeframe.period, "2200-0000", "UTC")
plot(na(t) ? 0 : 1, "in")
`;
        const pineTS = makePineTS();
        const { plots } = await pineTS.run(code);

        const data = plots['in'].data;
        expect(data.length).toBeGreaterThan(0);

        for (const d of data) {
            const h = new Date(d.time).getUTCHours();
            const expected = h >= 22 ? 1 : 0;
            expect(d.value).toBe(expected);
        }
    });

    it('rejects malformed session strings instead of treating every bar as in-session', async () => {
        const code = `
//@version=5
indicator("invalid session")
t = time(timeframe.period, "not-a-session", "UTC")
plot(na(t) ? 0 : 1, "in")
`;
        const pineTS = makePineTS();
        await expect(pineTS.run(code)).rejects.toThrow(/session/i);
    });
});
