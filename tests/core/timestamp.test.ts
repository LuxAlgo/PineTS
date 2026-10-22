import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

describe('timestamp()', () => {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-02-01').getTime());

    it('timestamp(year, month, day) — components with defaults, UTC fallback', async () => {
        const { result } = await pineTS.run(($) => {
            const { timestamp } = $.pine;
            return { ts: timestamp(2024, 1, 15) };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // No syminfo.timezone on Mock → falls back to UTC
        // 2024-01-15 00:00:00 UTC
        const expected = Date.UTC(2024, 0, 15, 0, 0, 0);
        expect(result.ts[0]).toBe(expected);
    });

    it('timestamp(year, month, day, hour, minute, second) — full components', async () => {
        const { result } = await pineTS.run(($) => {
            const { timestamp } = $.pine;
            return { ts: timestamp(2024, 6, 15, 14, 30, 45) };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        const expected = Date.UTC(2024, 5, 15, 14, 30, 45);
        expect(result.ts[0]).toBe(expected);
    });

    it('timestamp(dateString) — ISO 8601 string', async () => {
        const { result } = await pineTS.run(($) => {
            const { timestamp } = $.pine;
            return { ts: timestamp('2024-01-15T10:30:00Z') };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        const expected = Date.UTC(2024, 0, 15, 10, 30, 0);
        expect(result.ts[0]).toBe(expected);
    });

    it('timestamp(dateString) — RFC 2822 style string', async () => {
        const { result } = await pineTS.run(($) => {
            const { timestamp } = $.pine;
            return { ts: timestamp('01 Sep 2020 13:30 +0000') };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        const expected = Date.UTC(2020, 8, 1, 13, 30, 0);
        expect(result.ts[0]).toBe(expected);
    });

    it('timestamp(timezone, year, month, day, hour, minute, second) — UTC offset', async () => {
        const { result } = await pineTS.run(($) => {
            const { timestamp } = $.pine;
            return { ts: timestamp('UTC+5', 2024, 1, 15, 12, 0, 0) };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // 2024-01-15 12:00:00 in UTC+5 = 2024-01-15 07:00:00 UTC
        const expected = Date.UTC(2024, 0, 15, 7, 0, 0);
        expect(result.ts[0]).toBe(expected);
    });

    it('timestamp(timezone, year, month, day, hour, minute, second) — GMT offset', async () => {
        const { result } = await pineTS.run(($) => {
            const { timestamp } = $.pine;
            return { ts: timestamp('GMT-3', 2024, 6, 1, 0, 0, 0) };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // 2024-06-01 00:00:00 in GMT-3 = 2024-06-01 03:00:00 UTC
        const expected = Date.UTC(2024, 5, 1, 3, 0, 0);
        expect(result.ts[0]).toBe(expected);
    });

    it('timestamp(timezone, year, month, day, hour, minute, second) — IANA timezone', async () => {
        const { result } = await pineTS.run(($) => {
            const { timestamp } = $.pine;
            return { ts: timestamp('America/New_York', 2024, 1, 15, 12, 0, 0) };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // 2024-01-15 12:00:00 EST = 2024-01-15 17:00:00 UTC (EST = UTC-5, January = no DST)
        const expected = Date.UTC(2024, 0, 15, 17, 0, 0);
        expect(result.ts[0]).toBe(expected);
    });

    it('timestamp(timezone, year, month, day) — IANA timezone with default hour/minute/second', async () => {
        const { result } = await pineTS.run(($) => {
            const { timestamp } = $.pine;
            return { ts: timestamp('Europe/London', 2024, 7, 1) };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // 2024-07-01 00:00:00 BST (UTC+1, July = DST) = 2024-06-30 23:00:00 UTC
        const expected = Date.UTC(2024, 5, 30, 23, 0, 0);
        expect(result.ts[0]).toBe(expected);
    });

    it('out-of-range values roll over', async () => {
        const { result } = await pineTS.run(($) => {
            const { timestamp } = $.pine;
            // month 13 should roll to January next year
            return { ts: timestamp(2024, 13, 1) };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        const expected = Date.UTC(2025, 0, 1, 0, 0, 0);
        expect(result.ts[0]).toBe(expected);
    });

    it('works with Pine Script syntax', async () => {
        const code = `
//@version=5
indicator("Timestamp Test")
ts = timestamp(2024, 1, 15, 12, 0, 0)
plot(ts, "ts")
`;
        const { plots } = await pineTS.run(code, undefined, undefined, { sourceMode: 'trustedJavaScript' });
        const expected = Date.UTC(2024, 0, 15, 12, 0, 0);
        expect(plots['ts']).toBeDefined();
        expect(plots['ts'].data[0].value).toBe(expected);
    });
});
