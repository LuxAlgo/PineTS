// SPDX-License-Identifier: AGPL-3.0-only

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BinanceProvider } from '@pinets/marketData/Binance/BinanceProvider.class';
import { PineTS } from '../../src/PineTS.class';

const MIN = 60_000;
const H = 60 * MIN;
const D = 24 * H;
const INTERVAL_MS: Record<string, number> = { '1h': H, '2h': 2 * H, '4h': 4 * H, '1d': D };
const NOW = Date.UTC(2026, 8, 28);
// First candle of the symbol; the endpoint returns nothing before it.
let listedAt = 0;

// Price at an instant; a candle's close is the price at its close, so every
// timeframe built from these candles is consistent with the others.
const priceAt = (t: number) => 10_000 + ((t / MIN) % 10_007);

/**
 * Emulates GET /api/v3/klines: 500 candles when `limit` is omitted, at most 1000,
 * the first `limit` candles from `startTime`, or the last `limit` ending at `endTime`.
 */
function klines(url: URL) {
    const step = INTERVAL_MS[url.searchParams.get('interval')!];
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 500), 1000);
    const start = url.searchParams.get('startTime');
    const end = Math.min(Number(url.searchParams.get('endTime') ?? NOW), NOW);
    const lastOpen = Math.floor(end / step) * step;
    const firstOpen = Math.max(listedAt, start !== null ? Math.ceil(Number(start) / step) * step : lastOpen - (limit - 1) * step);
    const rows: any[] = [];
    for (let t = firstOpen; t <= lastOpen && rows.length < limit; t += step) {
        const open = priceAt(t);
        const close = priceAt(t + step);
        rows.push([t, `${open}`, `${Math.max(open, close) + 1}`, `${Math.min(open, close) - 1}`, `${close}`, '1', t + step - 1, '0', 1, '0', '0', '0']);
    }
    return rows;
}

function fakeBinance(input: any): Response {
    const url = new URL(String(input));
    if (url.pathname.endsWith('/ping')) return Response.json({});
    if (url.pathname.endsWith('/klines')) return Response.json(klines(url));
    if (url.pathname.endsWith('/exchangeInfo')) {
        return Response.json({ symbols: [{ symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', filters: [] }] });
    }
    return new Response(null, { status: 404 });
}

describe('BinanceProvider date-range pagination', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn(async (input: any) => fakeBinance(input)));
    });
    afterEach(() => {
        vi.unstubAllGlobals();
        listedAt = 0;
    });

    it('returns the candles of a range that starts more than 1000 candles before the listing', async () => {
        listedAt = Date.UTC(2024, 0, 10);
        const data = await new BinanceProvider().getMarketData('BTCUSDT', 'D', undefined, Date.UTC(2020, 0, 1), Date.UTC(2024, 2, 1) - 1);

        expect(data.length).toBe(51);
        expect(data[0].openTime).toBe(listedAt);
        expect(data[data.length - 1].openTime).toBe(Date.UTC(2024, 1, 29));
    });

    it.each([400, 500, 501, 700, 1000, 1001, 2500])('returns every 1h candle of a %i-candle range', async (n) => {
        const sDate = Date.UTC(2026, 5, 1);
        const eDate = sDate + n * H - 1;
        const data = await new BinanceProvider().getMarketData('BTCUSDT', '60', undefined, sDate, eDate);

        expect(data.length).toBe(n);
        expect(data[0].openTime).toBe(sDate);
        expect(data[data.length - 1].openTime).toBe(sDate + (n - 1) * H);
        expect(data.every((k, i) => i === 0 || k.openTime - data[i - 1].openTime === H)).toBe(true);
    });

    it('returns every daily candle of an 850-day range', async () => {
        const sDate = Date.UTC(2024, 0, 1);
        const eDate = sDate + 850 * D - 1;
        const data = await new BinanceProvider().getMarketData('BTCUSDT', 'D', undefined, sDate, eDate);

        expect(data.length).toBe(850);
        expect(data[data.length - 1].openTime).toBe(sDate + 849 * D);
    });

    it('keeps request.security values on the last bars when the higher timeframe needs 501-1000 candles', async () => {
        // 400 1h bars; the 2h context adds a 30-day buffer, so it needs ~560 candles.
        const eDate = Date.UTC(2026, 8, 20);
        const sDate = eDate - 400 * H;
        const pineTS = new PineTS(new BinanceProvider(), 'BTCUSDT', '60', null, sDate, eDate - 1);
        const { plots } = await pineTS.run(`//@version=6
indicator("htf")
plot(close, "close")
plot(request.security(syminfo.tickerid, "120", close), "h2")
`);
        const close = plots['close'].data;
        const h2 = plots['h2'].data;
        expect(close.length).toBe(400);

        // TradingView (BINANCE:BTCUSDT 1h): the 2h close equals the chart close on the bar that
        // ends a 2h candle (odd UTC hour) and the previous chart close on the bar that starts one.
        for (let i = 1; i < h2.length; i++) {
            const endsHtfBar = new Date(h2[i].time).getUTCHours() % 2 === 1;
            expect(h2[i].value).toBe(endsHtfBar ? close[i].value : close[i - 1].value);
        }
    });
});
