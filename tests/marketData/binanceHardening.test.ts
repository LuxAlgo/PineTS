// SPDX-License-Identifier: AGPL-3.0-only

import { afterEach, describe, expect, it, vi } from 'vitest';
import { BinanceProvider } from '@pinets/marketData/Binance/BinanceProvider.class';

function row(openTime: number, closeTime: number): (number | string)[] {
    return [openTime, '1', '2', '0.5', '1.5', '1', closeTime, '0', 1, '0', '0', '0'];
}

afterEach(() => vi.unstubAllGlobals());

describe('BinanceProvider query and pagination boundaries', () => {
    it.each(['BTCUSDT&limit=1#fragment', 'BTCUSDT%26limit%3D1'])(
        'keeps query syntax inside the kline symbol %s', async (symbol) => {
            let requestUrl: URL | undefined;
            vi.stubGlobal('fetch', vi.fn(async (input: string) => {
                const url = new URL(String(input));
                if (url.pathname.endsWith('/ping')) return Response.json({});
                requestUrl = url;
                return Response.json([]);
            }));

            await new BinanceProvider().getMarketData(symbol, '60', 10);

            expect(requestUrl?.searchParams.get('symbol')).toBe(symbol);
            expect(requestUrl?.searchParams.get('interval')).toBe('1h');
            expect(requestUrl?.searchParams.getAll('limit')).toEqual(['10']);
        });

    it('keeps punctuation inside the exchange-info symbol', async () => {
        let requestUrl: URL | undefined;
        vi.stubGlobal('fetch', vi.fn(async (input: string) => {
            const url = new URL(String(input));
            if (url.pathname.endsWith('/ping')) return Response.json({});
            requestUrl = url;
            return Response.json({ symbols: [{ symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', filters: [] }] });
        }));

        const symbol = 'BTCUSDT&foo=bar#fragment';
        await new BinanceProvider().getSymbolInfo(symbol);

        expect(requestUrl?.searchParams.get('symbol')).toBe(symbol);
        expect([...requestUrl!.searchParams.keys()]).toEqual(['symbol']);
    });

    it('stops a successful page that repeats the cursor', async () => {
        let requests = 0;
        vi.stubGlobal('fetch', vi.fn(async (input: string) => {
            if (new URL(String(input)).pathname.endsWith('/ping')) return Response.json({});
            if (++requests > 5) throw new Error('bounded test stub stopped repeated pagination');
            return Response.json([row(1, 1)]);
        }));

        const data = await new BinanceProvider().getMarketDataInterval('BTCUSDT', '60', 1, 100);

        expect(data).toEqual([]);
        expect(requests).toBe(2);
    });

    it('stops an older page without retrying it', async () => {
        let requests = 0;
        vi.stubGlobal('fetch', vi.fn(async (input: string) => {
            if (new URL(String(input)).pathname.endsWith('/ping')) return Response.json({});
            if (++requests > 5) throw new Error('bounded test stub stopped older pagination');
            return Response.json(requests === 1 ? [row(1, 2)] : [row(0, 0)]);
        }));

        const data = await new BinanceProvider().getMarketDataInterval('BTCUSDT', '60', 1, 100);

        expect(data).toEqual([]);
        expect(requests).toBe(2);
    });

    it('stops an empty page when recovery does not advance', async () => {
        let requests = 0;
        vi.stubGlobal('fetch', vi.fn(async (input: string) => {
            if (new URL(String(input)).pathname.endsWith('/ping')) return Response.json({});
            requests++;
            return Response.json(requests === 1 ? [] : [row(1, 1)]);
        }));

        const data = await new BinanceProvider().getMarketDataInterval('BTCUSDT', '60', 1, 100);

        expect(data).toEqual([]);
        expect(requests).toBe(2);
    });

    it('deduplicates overlapping successful pages', async () => {
        let requests = 0;
        vi.stubGlobal('fetch', vi.fn(async (input: string) => {
            if (new URL(String(input)).pathname.endsWith('/ping')) return Response.json({});
            requests++;
            return Response.json(requests === 1 ? [row(1, 2), row(3, 4)] : [row(3, 4), row(5, 6)]);
        }));

        const data = await new BinanceProvider().getMarketDataInterval('BTCUSDT', '60', 1, 7);

        expect(data.map((bar) => bar.openTime)).toEqual([1, 3, 5]);
        expect(requests).toBe(2);
    });

    it('caps successful pages even when each page advances', async () => {
        let requests = 0;
        vi.stubGlobal('fetch', vi.fn(async (input: string) => {
            const url = new URL(String(input));
            if (url.pathname.endsWith('/ping')) return Response.json({});
            if (++requests > 205) throw new Error('bounded test stub stopped excessive pagination');
            const start = Number(url.searchParams.get('startTime'));
            return Response.json([row(start, start)]);
        }));

        const data = await new BinanceProvider().getMarketDataInterval('BTCUSDT', '60', 1, 500);

        expect(data).toEqual([]);
        expect(requests).toBe(200);
    });

    it('rejects a page larger than Binance can return', async () => {
        let requests = 0;
        vi.stubGlobal('fetch', vi.fn(async (input: string) => {
            if (new URL(String(input)).pathname.endsWith('/ping')) return Response.json({});
            requests++;
            return Response.json(Array.from({ length: 1001 }, (_, i) => row(i + 1, i + 1)));
        }));

        const data = await new BinanceProvider().getMarketDataInterval('BTCUSDT', '60', 1, 1002);

        expect(data).toEqual([]);
        expect(requests).toBe(1);
    });

    it('caps aggregate bars before issuing another page request', async () => {
        let requests = 0;
        vi.stubGlobal('fetch', vi.fn(async (input: string) => {
            const url = new URL(String(input));
            if (url.pathname.endsWith('/ping')) return Response.json({});
            requests++;
            const start = Number(url.searchParams.get('startTime'));
            return Response.json(Array.from({ length: 1000 }, (_, i) => row(start + i, start + i)));
        }));

        const data = await new BinanceProvider().getMarketDataInterval('BTCUSDT', '60', 1, 100_002);

        expect(data).toEqual([]);
        expect(requests).toBe(100);
    });

    it('keeps chronological order for legitimate backward pagination', async () => {
        let requests = 0;
        vi.stubGlobal('fetch', vi.fn(async (input: string) => {
            const url = new URL(String(input));
            if (url.pathname.endsWith('/ping')) return Response.json({});
            requests++;
            const end = Number(url.searchParams.get('endTime') ?? 2000);
            const limit = Number(url.searchParams.get('limit'));
            return Response.json(Array.from({ length: limit }, (_, i) => row(end - limit + i + 1, end - limit + i + 1)));
        }));

        const data = await new BinanceProvider().getMarketData('BTCUSDT', '60', 1500);

        expect(data.length).toBe(1500);
        expect(data[0].openTime).toBe(501);
        expect(data[data.length - 1].openTime).toBe(2000);
        expect(requests).toBe(2);
    });

    it('rejects a repeated backward page', async () => {
        let requests = 0;
        const page = Array.from({ length: 1000 }, (_, i) => row(i + 1, i + 1));
        vi.stubGlobal('fetch', vi.fn(async (input: string) => {
            if (new URL(String(input)).pathname.endsWith('/ping')) return Response.json({});
            requests++;
            return Response.json(page);
        }));

        const data = await new BinanceProvider().getMarketData('BTCUSDT', '60', 2000);

        expect(data).toEqual([]);
        expect(requests).toBe(2);
    });

    it('propagates caller cancellation to an active fetch', async () => {
        const controller = new AbortController();
        let requests = 0;
        let fetchHadSignal = false;
        vi.stubGlobal('fetch', vi.fn(async (input: string, options?: RequestInit) => {
            if (new URL(String(input)).pathname.endsWith('/ping')) return Response.json({});
            requests++;
            fetchHadSignal = options?.signal instanceof AbortSignal;
            controller.abort();
            return Response.json([row(1, 1)]);
        }));

        const data = await new BinanceProvider({ signal: controller.signal })
            .getMarketDataInterval('BTCUSDT', '60', 1, 100);

        expect(data).toEqual([]);
        expect(requests).toBe(1);
        expect(fetchHadSignal).toBe(true);
    });

    it('enforces a deadline even if a fetch ignores abort', async () => {
        vi.useFakeTimers();
        try {
            let requests = 0;
            vi.stubGlobal('fetch', vi.fn(async (input: string) => {
                if (new URL(String(input)).pathname.endsWith('/ping')) return Response.json({});
                requests++;
                return new Promise<Response>(() => {});
            }));

            const result = new BinanceProvider().getMarketDataInterval('BTCUSDT', '60', 1, 100);
            await vi.advanceTimersByTimeAsync(1);
            expect(requests).toBe(1);
            await vi.advanceTimersByTimeAsync(15_000);

            expect(await result).toEqual([]);
            expect(requests).toBe(1);
        } finally {
            vi.useRealTimers();
        }
    });
});
