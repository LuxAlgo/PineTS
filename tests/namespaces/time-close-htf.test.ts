import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';

// time_close(tf) on a lower chart timeframe is the CLOSE of the higher-timeframe bar that
// holds the chart bar. It used to return that bar's OPEN, so FractalModel's countdown
// `time_close("60") - timenow` was negative on every live bar and printed 00:00:00.
// On a session market the higher-timeframe bars follow the declared session, as on
// TradingView: a futures 1D bar is 18:00 ET → 17:00 ET, 4H bars run from 18:00 ET.

const FIVE_MIN = 5 * 60_000;
const utc = (iso: string) => new Date(iso).getTime();

function provider(syminfo: Record<string, unknown>, firstOpen: number, count: number) {
    const bars = Array.from({ length: count }, (_, i) => {
        const openTime = firstOpen + i * FIVE_MIN;
        return { openTime, closeTime: openTime + FIVE_MIN, open: 100, high: 101, low: 99, close: 100, volume: 1 };
    });
    return {
        getMarketData: async () => bars,
        getSymbolInfo: async () => syminfo,
    };
}

async function valuesAt(syminfo: Record<string, unknown>, firstOpen: number, count: number, openTime: number) {
    const src = `//@version=6
indicator("htf close")
plot(time_close("60"), "h1c")
plot(time_close("240"), "h4c")
plot(time_close("1D"), "d1c")
plot(time("240"), "h4o")
plot(time("1D"), "d1o")`;
    const pineTS = new PineTS(provider(syminfo, firstOpen, count) as any, 'SYM', '5', null, firstOpen, firstOpen + count * FIVE_MIN);
    const { plots } = await pineTS.run(src);
    const at = (title: string) => plots[title].data.find((d: any) => d.time === openTime)?.value;
    return { h1c: at('h1c'), h4c: at('h4c'), d1c: at('d1c'), h4o: at('h4o'), d1o: at('d1o') };
}

const FUTURES = { ticker: '/NQ', tickerid: '/NQ', timezone: 'America/New_York', session: '0930-1600', session_extended: '1800-1700', type: 'futures', mintick: 0.25 };

describe('time_close(tf) on a lower timeframe', () => {
    // 2026-10-08 18:00 ET (EDT) = 22:00 UTC: one ETH evening of 5m bars, to 23:55 ET
    const firstOpen = utc('2026-10-08T22:00:00Z');

    it('is the close of the higher-timeframe bar, on the futures trading day', async () => {
        // the 23:40 ET bar (03:40 UTC on the 9th)
        const v = await valuesAt(FUTURES, firstOpen, 72, utc('2026-10-09T03:40:00Z'));
        expect(v.h1c).toBe(utc('2026-10-09T04:00:00Z')); // 00:00 ET
        expect(v.h4o).toBe(utc('2026-10-09T02:00:00Z')); // 22:00 ET, 4H from the 18:00 open
        expect(v.h4c).toBe(utc('2026-10-09T06:00:00Z')); // 02:00 ET
        expect(v.d1o).toBe(utc('2026-10-08T22:00:00Z')); // 18:00 ET
        expect(v.d1c).toBe(utc('2026-10-09T21:00:00Z')); // 17:00 ET next day
    });

    it('locates the bar by its open: the bar closing ON the boundary belongs to the hour before', async () => {
        // the 21:55 ET bar closes at 22:00 ET, where the 18:00 4H bar ends
        const v = await valuesAt(FUTURES, firstOpen, 72, utc('2026-10-09T01:55:00Z'));
        expect(v.h4c).toBe(utc('2026-10-09T02:00:00Z')); // 22:00 ET, not 02:00 ET
        expect(v.h1c).toBe(utc('2026-10-09T02:00:00Z'));
    });

    it('keeps the UTC calendar grid for a symbol with no HHMM-HHMM session', async () => {
        const crypto = { ticker: 'BTCUSD', tickerid: 'BTCUSD', timezone: 'UTC', session: '24x7', type: 'crypto', mintick: 0.01 };
        const v = await valuesAt(crypto, firstOpen, 72, utc('2026-10-09T03:40:00Z'));
        expect(v.h1c).toBe(utc('2026-10-09T04:00:00Z'));
        expect(v.h4o).toBe(utc('2026-10-09T00:00:00Z'));
        expect(v.h4c).toBe(utc('2026-10-09T04:00:00Z'));
        expect(v.d1o).toBe(utc('2026-10-09T00:00:00Z'));
        expect(v.d1c).toBe(utc('2026-10-10T00:00:00Z'));
    });
});
