// SPDX-License-Identifier: AGPL-3.0-only

import { describe, it, expect } from 'vitest';
import { BaseProvider } from '@pinets/marketData/BaseProvider';
import { ISymbolInfo } from '@pinets/marketData/IProvider';
import { Kline } from '@pinets/marketData/types';

// ── Test provider with limited timeframe support ──────────────────────

/** A test provider that only supports 1min, 15min, 60min, and D. */
class LimitedProvider extends BaseProvider {
    private _fakeData: Map<string, Kline[]> = new Map();

    constructor() {
        super({ requiresApiKey: false, providerName: 'TestLimited' });
    }

    protected getSupportedTimeframes(): Set<string> {
        return new Set(['1', '15', '60', 'D']);
    }

    /** Inject fake data for a given timeframe. */
    setFakeData(timeframe: string, data: Kline[]): void {
        this._fakeData.set(timeframe, data);
    }

    protected async _getMarketDataNative(
        tickerId: string,
        timeframe: string,
        limit?: number,
        sDate?: number,
        eDate?: number,
    ): Promise<Kline[]> {
        const data = this._fakeData.get(timeframe) ?? [];
        if (limit && limit > 0) return data.slice(0, limit);
        return data;
    }

    async getSymbolInfo(tickerId: string): Promise<ISymbolInfo> {
        return null as any;
    }
}

// ── Helpers ───────────────────────────────────────────────────────────

function make15minCandles(count: number, baseTime: number = Date.UTC(2024, 0, 2, 9, 30)): Kline[] {
    const candles: Kline[] = [];
    for (let i = 0; i < count; i++) {
        const openTime = baseTime + i * 15 * 60_000;
        candles.push({
            openTime,
            open: 100 + i,
            high: 105 + i,
            low: 95 + i,
            close: 102 + i,
            volume: 1000 + i * 100,
            closeTime: openTime + 15 * 60_000,
            quoteAssetVolume: 0,
            numberOfTrades: 10,
            takerBuyBaseAssetVolume: 0,
            takerBuyQuoteAssetVolume: 0,
            ignore: 0,
        });
    }
    return candles;
}

function make1hCandles(count: number, baseTime: number = Date.UTC(2024, 0, 2, 9, 0)): Kline[] {
    const candles: Kline[] = [];
    for (let i = 0; i < count; i++) {
        const openTime = baseTime + i * 3600_000;
        candles.push({
            openTime,
            open: 100 + i * 5,
            high: 110 + i * 5,
            low: 90 + i * 5,
            close: 105 + i * 5,
            volume: 5000 + i * 500,
            closeTime: openTime + 3600_000,
            quoteAssetVolume: 0,
            numberOfTrades: 50,
            takerBuyBaseAssetVolume: 0,
            takerBuyQuoteAssetVolume: 0,
            ignore: 0,
        });
    }
    return candles;
}

function makeDailyCandles(count: number, baseTime: number = Date.UTC(2024, 0, 1)): Kline[] {
    const candles: Kline[] = [];
    for (let i = 0; i < count; i++) {
        const openTime = baseTime + i * 86_400_000;
        candles.push({
            openTime,
            open: 100 + i,
            high: 105 + i,
            low: 95 + i,
            close: 102 + i,
            volume: 10000 + i * 1000,
            closeTime: openTime + 86_400_000,
            quoteAssetVolume: 0,
            numberOfTrades: 100,
            takerBuyBaseAssetVolume: 0,
            takerBuyQuoteAssetVolume: 0,
            ignore: 0,
        });
    }
    return candles;
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('BaseProvider aggregation integration', () => {
    it('should delegate natively supported timeframes directly', async () => {
        const provider = new LimitedProvider();
        const data15 = make15minCandles(4);
        provider.setFakeData('15', data15);

        const result = await provider.getMarketData('TEST', '15');
        expect(result).toEqual(data15);
    });

    it('should aggregate 15min → 45min (3:1 ratio)', async () => {
        const provider = new LimitedProvider();
        provider.setFakeData('15', make15minCandles(12)); // 4 × 45min bars

        const result = await provider.getMarketData('TEST', '45');
        expect(result).toHaveLength(4);
        // First 45min bar uses candles 0-2
        expect(result[0].open).toBe(100);
        expect(result[0].close).toBe(104);
    });

    it('should aggregate 60min → 240min (4:1 ratio)', async () => {
        const provider = new LimitedProvider();
        provider.setFakeData('60', make1hCandles(8)); // 2 × 4h bars

        const result = await provider.getMarketData('TEST', '240');
        expect(result).toHaveLength(2);
    });

    it('should aggregate D → W (weekly from daily)', async () => {
        const provider = new LimitedProvider();
        // 2024-01-01 is Monday, 14 days = 2 complete weeks
        provider.setFakeData('D', makeDailyCandles(14, Date.UTC(2024, 0, 1)));

        const result = await provider.getMarketData('TEST', 'W');
        expect(result).toHaveLength(2);
    });

    it('should aggregate D → M (monthly from daily)', async () => {
        const provider = new LimitedProvider();
        // Jan 2024 (31d) + Feb 2024 (29d) = 60 days
        provider.setFakeData('D', makeDailyCandles(60, Date.UTC(2024, 0, 1)));

        const result = await provider.getMarketData('TEST', 'M');
        expect(result).toHaveLength(2);
    });

    it('should respect limit parameter with aggregation', async () => {
        const provider = new LimitedProvider();
        provider.setFakeData('15', make15minCandles(24)); // 8 × 45min bars

        const result = await provider.getMarketData('TEST', '45', 3);
        expect(result).toHaveLength(3);
        // Should return the LAST 3 bars (most recent)
    });

    it('should normalize timeframe aliases', async () => {
        const provider = new LimitedProvider();
        const data = make1hCandles(4);
        provider.setFakeData('60', data);

        // '1h' should normalize to '60' and be treated as native
        const result = await provider.getMarketData('TEST', '1h');
        expect(result).toEqual(data);
    });

    it('should return empty for completely unsupported timeframe', async () => {
        const provider = new LimitedProvider();
        // Provider supports {1, 15, 60, D} — '5S' has no valid sub-TF
        const result = await provider.getMarketData('TEST', '5S');
        expect(result).toEqual([]);
    });

    it('should use forced sub-timeframe when set', async () => {
        const provider = new LimitedProvider();
        const data1min = make15minCandles(12); // actually 15min spaced, but labeled as '1' data
        provider.setFakeData('1', data1min);
        provider.setFakeData('15', make15minCandles(4)); // different data

        // Force use of 1min instead of auto-selected 15min
        provider.setAggregationSubTimeframe('1');
        const result = await provider.getMarketData('TEST', '45');
        // Should use the '1' data, not '15' data
        expect(result.length).toBeGreaterThan(0);
    });

    it('should fall back to auto-selection if forced sub-TF is not supported', async () => {
        const provider = new LimitedProvider();
        provider.setFakeData('15', make15minCandles(6));

        // Force '5' which is not in LimitedProvider's supported set
        provider.setAggregationSubTimeframe('5');
        const result = await provider.getMarketData('TEST', '45');
        // Should fall back to '15' (auto-selected) and aggregate
        expect(result).toHaveLength(2);
    });
});
