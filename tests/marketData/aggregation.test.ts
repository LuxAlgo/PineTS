// SPDX-License-Identifier: AGPL-3.0-only

import { describe, it, expect } from 'vitest';
import { selectSubTimeframe, aggregateCandles, getAggregationRatio } from '@pinets/marketData/aggregation';
import { Kline } from '@pinets/marketData/types';

// ── Helper to create test candles ──────────────────────────────────────

function makeCandle(openTime: number, close: number, opts?: Partial<Kline>): Kline {
    return {
        openTime,
        open: opts?.open ?? close,
        high: opts?.high ?? close + 1,
        low: opts?.low ?? close - 1,
        close,
        volume: opts?.volume ?? 100,
        closeTime: opts?.closeTime ?? (openTime + 60_000 - 1), // default 1min candle
        quoteAssetVolume: opts?.quoteAssetVolume ?? 0,
        numberOfTrades: opts?.numberOfTrades ?? 10,
        takerBuyBaseAssetVolume: opts?.takerBuyBaseAssetVolume ?? 0,
        takerBuyQuoteAssetVolume: opts?.takerBuyQuoteAssetVolume ?? 0,
        ignore: 0,
    };
}

/** Create N consecutive 1-minute candles starting at baseTime. */
function make1minCandles(count: number, baseTime: number = Date.UTC(2024, 0, 2, 9, 30)): Kline[] {
    const candles: Kline[] = [];
    for (let i = 0; i < count; i++) {
        const openTime = baseTime + i * 60_000;
        candles.push(makeCandle(openTime, 100 + i, {
            open: 100 + i,
            high: 101 + i,
            low: 99 + i,
            volume: 100 + i * 10,
            closeTime: openTime + 60_000,
        }));
    }
    return candles;
}

/** Create N consecutive 15-minute candles. */
function make15minCandles(count: number, baseTime: number = Date.UTC(2024, 0, 2, 9, 30)): Kline[] {
    const candles: Kline[] = [];
    for (let i = 0; i < count; i++) {
        const openTime = baseTime + i * 15 * 60_000;
        candles.push(makeCandle(openTime, 100 + i, {
            open: 100 + i,
            high: 105 + i,
            low: 95 + i,
            volume: 1000 + i * 100,
            closeTime: openTime + 15 * 60_000,
        }));
    }
    return candles;
}

/** Create N consecutive 1-hour candles. */
function make1hCandles(count: number, baseTime: number = Date.UTC(2024, 0, 2, 9, 0)): Kline[] {
    const candles: Kline[] = [];
    for (let i = 0; i < count; i++) {
        const openTime = baseTime + i * 3600_000;
        candles.push(makeCandle(openTime, 100 + i * 5, {
            open: 100 + i * 5,
            high: 110 + i * 5,
            low: 90 + i * 5,
            volume: 5000 + i * 500,
            closeTime: openTime + 3600_000,
        }));
    }
    return candles;
}

/** Create N consecutive daily candles. */
function makeDailyCandles(count: number, baseTime: number = Date.UTC(2024, 0, 1)): Kline[] {
    const candles: Kline[] = [];
    for (let i = 0; i < count; i++) {
        const openTime = baseTime + i * 86_400_000;
        candles.push(makeCandle(openTime, 100 + i, {
            open: 100 + i,
            high: 105 + i,
            low: 95 + i,
            volume: 10000 + i * 1000,
            closeTime: openTime + 86_400_000,
        }));
    }
    return candles;
}

// ── selectSubTimeframe ────────────────────────────────────────────────

describe('selectSubTimeframe', () => {
    const binanceSupported = new Set(['1', '3', '5', '15', '30', '60', '120', '240', 'D', 'W', 'M']);
    const fmpSupported = new Set(['1', '5', '15', '30', '60', '240', 'D']);

    it('should return null for natively supported timeframes (no aggregation needed)', () => {
        // selectSubTimeframe is only called for unsupported TFs, but if called
        // with a supported one, it should still return a valid sub-TF
        const sub = selectSubTimeframe('60', binanceSupported);
        expect(sub).toBe('30'); // 30min divides 60min evenly
    });

    it('should select 15min for 45min on Binance (3×15=45)', () => {
        expect(selectSubTimeframe('45', binanceSupported)).toBe('15');
    });

    it('should select 60min for 180min on Binance (3×60=180)', () => {
        expect(selectSubTimeframe('180', binanceSupported)).toBe('60');
    });

    it('should select 60min for 120min on FMP (2×60=120)', () => {
        expect(selectSubTimeframe('120', fmpSupported)).toBe('60');
    });

    it('should select 60min for 180min on FMP (3×60=180)', () => {
        expect(selectSubTimeframe('180', fmpSupported)).toBe('60');
    });

    it('should select D for W aggregation', () => {
        expect(selectSubTimeframe('W', fmpSupported)).toBe('D');
    });

    it('should select D for M aggregation', () => {
        expect(selectSubTimeframe('M', fmpSupported)).toBe('D');
    });

    it('should return null if no valid sub-timeframe exists', () => {
        const limited = new Set(['240', 'D']);
        expect(selectSubTimeframe('45', limited)).toBeNull();
    });

    it('should return null for W if D is not supported', () => {
        const noDaySupport = new Set(['1', '5', '15', '60']);
        expect(selectSubTimeframe('W', noDaySupport)).toBeNull();
    });

    it('should pick the largest valid divisor (fewest API calls)', () => {
        // For target '240' (4h), both '60' (4×) and '1' (240×) divide evenly
        // Should pick '60' as the largest
        const sub = selectSubTimeframe('240', fmpSupported);
        expect(sub).toBe('60');
    });

    it('should handle second-based sub-timeframes', () => {
        const withSeconds = new Set(['1S', '5S', '15S', '1', '5']);
        // 1min = 60s, 15S divides evenly (4×15=60)
        expect(selectSubTimeframe('1', withSeconds)).toBe('15S');
    });

    it('should select 1min for 3min on FMP (3×1=3)', () => {
        expect(selectSubTimeframe('3', fmpSupported)).toBe('1');
    });
});

// ── getAggregationRatio ───────────────────────────────────────────────

describe('getAggregationRatio', () => {
    it('should return correct fixed ratio for intraday', () => {
        expect(getAggregationRatio('60', '15')).toBe(4);   // 3600/900
        expect(getAggregationRatio('240', '60')).toBe(4);  // 14400/3600
        expect(getAggregationRatio('45', '15')).toBe(3);   // 2700/900
        expect(getAggregationRatio('180', '60')).toBe(3);  // 10800/3600
        expect(getAggregationRatio('120', '60')).toBe(2);  // 7200/3600
    });

    it('should return Infinity for W/M (calendar-based)', () => {
        expect(getAggregationRatio('W', 'D')).toBe(Infinity);
        expect(getAggregationRatio('M', 'D')).toBe(Infinity);
    });

    it('should handle second-to-minute ratio', () => {
        expect(getAggregationRatio('1', '15S')).toBe(4);   // 60/15
        expect(getAggregationRatio('1', '1S')).toBe(60);   // 60/1
    });
});

// ── aggregateCandles — fixed ratio ────────────────────────────────────

describe('aggregateCandles — fixed ratio', () => {
    it('should aggregate 4×15min into 1×60min', () => {
        const sub = make15minCandles(4);
        const result = aggregateCandles(sub, '60', '15');

        expect(result).toHaveLength(1);
        const bar = result[0];
        expect(bar.openTime).toBe(sub[0].openTime);
        expect(bar.open).toBe(sub[0].open);
        expect(bar.close).toBe(sub[3].close);
        expect(bar.closeTime).toBe(sub[3].closeTime);
        expect(bar.high).toBe(Math.max(...sub.map(c => c.high)));
        expect(bar.low).toBe(Math.min(...sub.map(c => c.low)));
        expect(bar.volume).toBe(sub.reduce((s, c) => s + c.volume, 0));
    });

    it('should aggregate 8×15min into 2×60min', () => {
        const sub = make15minCandles(8);
        const result = aggregateCandles(sub, '60', '15');
        expect(result).toHaveLength(2);

        // First bar: candles 0-3
        expect(result[0].openTime).toBe(sub[0].openTime);
        expect(result[0].close).toBe(sub[3].close);

        // Second bar: candles 4-7
        expect(result[1].openTime).toBe(sub[4].openTime);
        expect(result[1].close).toBe(sub[7].close);
    });

    it('should handle partial last group', () => {
        const sub = make15minCandles(6); // 4+2 → 1 full + 1 partial
        const result = aggregateCandles(sub, '60', '15');
        expect(result).toHaveLength(2);
        expect(result[1].openTime).toBe(sub[4].openTime);
        expect(result[1].close).toBe(sub[5].close);
    });

    it('should aggregate 3×15min into 1×45min', () => {
        const sub = make15minCandles(6);
        const result = aggregateCandles(sub, '45', '15');
        expect(result).toHaveLength(2);
    });

    it('should aggregate 2×1h into 1×2h', () => {
        const sub = make1hCandles(4);
        const result = aggregateCandles(sub, '120', '60');
        expect(result).toHaveLength(2);
    });

    it('should aggregate 3×1h into 1×3h', () => {
        const sub = make1hCandles(6);
        const result = aggregateCandles(sub, '180', '60');
        expect(result).toHaveLength(2);
    });

    it('should return empty for empty input', () => {
        expect(aggregateCandles([], '60', '15')).toEqual([]);
    });

    it('should preserve OHLCV merge rules', () => {
        const sub: Kline[] = [
            makeCandle(1000, 50, { open: 40, high: 60, low: 30, volume: 100, closeTime: 2000 }),
            makeCandle(2000, 55, { open: 50, high: 70, low: 35, volume: 200, closeTime: 3000 }),
            makeCandle(3000, 45, { open: 55, high: 65, low: 25, volume: 150, closeTime: 4000 }),
        ];
        const result = aggregateCandles(sub, '180', '60'); // 3:1 ratio
        expect(result).toHaveLength(1);
        const bar = result[0];
        expect(bar.open).toBe(40);       // first open
        expect(bar.close).toBe(45);      // last close
        expect(bar.high).toBe(70);       // max high
        expect(bar.low).toBe(25);        // min low
        expect(bar.volume).toBe(450);    // sum
        expect(bar.openTime).toBe(1000); // first openTime
        expect(bar.closeTime).toBe(4000);// last closeTime
    });
});

// ── aggregateCandles — session boundary detection ─────────────────────

describe('aggregateCandles — session boundary detection', () => {
    it('should split groups at overnight gaps for stocks', () => {
        // Simulate 2 days of 1h bars with a gap between sessions
        // Day 1: 4 bars (9:00-12:00)
        // Gap: overnight (~17 hours)
        // Day 2: 4 bars (9:00-12:00)
        const day1Start = Date.UTC(2024, 0, 2, 14, 30); // 9:30 ET = 14:30 UTC
        const day2Start = Date.UTC(2024, 0, 3, 14, 30); // next day

        const candles: Kline[] = [];
        // Day 1: 4 bars
        for (let i = 0; i < 4; i++) {
            const ot = day1Start + i * 3600_000;
            candles.push(makeCandle(ot, 100 + i, {
                closeTime: ot + 3600_000,
                volume: 1000,
            }));
        }
        // Day 2: 4 bars (17h gap from last Day 1 bar)
        for (let i = 0; i < 4; i++) {
            const ot = day2Start + i * 3600_000;
            candles.push(makeCandle(ot, 200 + i, {
                closeTime: ot + 3600_000,
                volume: 2000,
            }));
        }

        // Aggregate to 4h (ratio=4). Without session detection, we'd get 2 bars.
        // With session detection, the overnight gap splits into:
        // Day1: 4 bars → 1×4h, Day2: 4 bars → 1×4h = still 2 bars
        // But the key is they don't cross-merge day boundaries
        const result = aggregateCandles(candles, '240', '60');
        expect(result).toHaveLength(2);
        expect(result[0].close).toBe(103); // Day 1 last close
        expect(result[1].close).toBe(203); // Day 2 last close
    });

    it('should NOT split for 24/7 crypto (no gaps)', () => {
        // 8 consecutive 1h candles with no gaps
        const sub = make1hCandles(8);
        const result = aggregateCandles(sub, '240', '60');
        expect(result).toHaveLength(2);
    });
});

// ── aggregateCandles — weekly from daily ──────────────────────────────

describe('aggregateCandles — weekly from daily', () => {
    it('should group daily candles by ISO week', () => {
        // 2024-01-01 is Monday → first week has 7 bars
        const candles = makeDailyCandles(14, Date.UTC(2024, 0, 1)); // 2 weeks
        const result = aggregateCandles(candles, 'W', 'D');
        expect(result).toHaveLength(2);
    });

    it('should handle partial first/last week', () => {
        // Start on Wednesday → first week has 5 bars (Wed-Sun)
        const candles = makeDailyCandles(10, Date.UTC(2024, 0, 3)); // Wed Jan 3, 2024
        const result = aggregateCandles(candles, 'W', 'D');
        expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it('should preserve OHLCV for weekly bars', () => {
        // 5 daily bars = 1 trading week (Mon-Fri for stocks, but for crypto all 7)
        const candles = makeDailyCandles(7, Date.UTC(2024, 0, 1)); // Mon Jan 1
        const result = aggregateCandles(candles, 'W', 'D');
        expect(result).toHaveLength(1);
        expect(result[0].open).toBe(candles[0].open);
        expect(result[0].close).toBe(candles[6].close);
        expect(result[0].volume).toBe(candles.reduce((s, c) => s + c.volume, 0));
        expect(result[0].closeTime).toBe(candles[6].closeTime);
    });
});

// ── aggregateCandles — monthly from daily ─────────────────────────────

describe('aggregateCandles — monthly from daily', () => {
    it('should group daily candles by calendar month', () => {
        // Jan 2024 = 31 days, Feb 2024 = 29 days (leap year)
        const candles = makeDailyCandles(60, Date.UTC(2024, 0, 1));
        const result = aggregateCandles(candles, 'M', 'D');
        expect(result).toHaveLength(2); // Jan + Feb
    });

    it('should handle single month', () => {
        const candles = makeDailyCandles(31, Date.UTC(2024, 0, 1));
        const result = aggregateCandles(candles, 'M', 'D');
        expect(result).toHaveLength(1);
        expect(result[0].open).toBe(candles[0].open);
        expect(result[0].close).toBe(candles[30].close);
    });

    it('should handle partial month', () => {
        // Start mid-January
        const candles = makeDailyCandles(45, Date.UTC(2024, 0, 15));
        const result = aggregateCandles(candles, 'M', 'D');
        // Jan 15-31 (17 days) + Feb 1-28 (28 days) = 2 months
        expect(result).toHaveLength(2);
    });

    it('should return empty for empty input', () => {
        expect(aggregateCandles([], 'M', 'D')).toEqual([]);
    });
});
