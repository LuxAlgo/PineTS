// SPDX-License-Identifier: AGPL-3.0-only
// Tests for request.security cross-timeframe fixes:
// 1. normalizeTimeframe() for non-canonical timeframe strings
// 2. barmerge string enum ('gaps_off'/'lookahead_off') → boolean conversion
// 3. Weekly→Daily (LTF) cross-TF correctness against TV reference data
// 4. 1h→Daily (HTF) cross-TF correctness (no NaN)

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';
import { normalizeTimeframe, TIMEFRAMES } from '../../src/namespaces/request/utils/TIMEFRAMES';

// ── normalizeTimeframe unit tests ──────────────────────────────────────────────

describe('normalizeTimeframe', () => {
    it('should pass through canonical formats unchanged', () => {
        for (const tf of TIMEFRAMES) {
            expect(normalizeTimeframe(tf)).toBe(tf);
        }
    });

    it('should normalize minute formats (1m, 3m, 5m, 10m, 15m, 30m, 45m)', () => {
        expect(normalizeTimeframe('1m')).toBe('1');
        expect(normalizeTimeframe('3m')).toBe('3');
        expect(normalizeTimeframe('5m')).toBe('5');
        expect(normalizeTimeframe('10m')).toBe('10');
        expect(normalizeTimeframe('15m')).toBe('15');
        expect(normalizeTimeframe('30m')).toBe('30');
        expect(normalizeTimeframe('45m')).toBe('45');
    });

    it('should normalize hour formats (1h, 2h, 3h, 4h, 6h, 8h, 12h)', () => {
        expect(normalizeTimeframe('1h')).toBe('60');
        expect(normalizeTimeframe('2h')).toBe('120');
        expect(normalizeTimeframe('3h')).toBe('180');
        expect(normalizeTimeframe('4h')).toBe('240');
        expect(normalizeTimeframe('6h')).toBe('360');
        expect(normalizeTimeframe('8h')).toBe('480');
        expect(normalizeTimeframe('12h')).toBe('720');
    });

    it('should normalize uppercase hour formats (1H, 4H, 6H, 8H, 12H)', () => {
        expect(normalizeTimeframe('1H')).toBe('60');
        expect(normalizeTimeframe('4H')).toBe('240');
        expect(normalizeTimeframe('6H')).toBe('360');
        expect(normalizeTimeframe('8H')).toBe('480');
        expect(normalizeTimeframe('12H')).toBe('720');
    });

    it('should normalize day/week/month formats', () => {
        expect(normalizeTimeframe('1d')).toBe('D');
        expect(normalizeTimeframe('1D')).toBe('D');
        expect(normalizeTimeframe('1w')).toBe('W');
        expect(normalizeTimeframe('1W')).toBe('W');
        expect(normalizeTimeframe('1M')).toBe('M');
    });

    it('should normalize lowercase single-letter formats (d, w, m)', () => {
        expect(normalizeTimeframe('d')).toBe('D');
        expect(normalizeTimeframe('w')).toBe('W');
        expect(normalizeTimeframe('m')).toBe('M');
    });

    it('should return unknown formats as-is', () => {
        expect(normalizeTimeframe('2D')).toBe('2D');
        expect(normalizeTimeframe('xyz')).toBe('xyz');
    });
});

// ── barmerge string enum handling ──────────────────────────────────────────────

describe('request.security barmerge string enum handling', () => {
    // Helper: extract plot data as { time, value }[] filtered to date range
    function extractPlot(
        plots: any,
        name: string,
        sDate: number,
        eDate: number,
    ): { time: string; value: any }[] {
        const plotdata = plots[name]?.data || [];
        return plotdata
            .filter((e: any) => e.time >= sDate && e.time <= eDate)
            .map((e: any) => ({
                time: new Date(e.time).toISOString().slice(0, 10),
                value: e.value,
            }));
    }

    it('barmerge.gaps_off/lookahead_off strings should behave like false/false', async () => {
        // The transpiler emits barmerge.gaps_off = 'gaps_off' and barmerge.lookahead_off = 'lookahead_off'
        // These are truthy strings and must be explicitly converted to boolean false.
        // Before the fix, they were passed directly to findLTFContextIdx/findSecContextIdx
        // where `if (gaps && lookahead)` evaluated as TRUE, taking the wrong code path.
        const sDate = new Date('2019-01-07').getTime();
        const eDate = new Date('2019-02-04').getTime();
        const warmup = 365 * 24 * 60 * 60 * 1000;

        const pineTS = new PineTS(Provider.Binance, 'BTCUSDC', 'W', null, sDate - warmup);

        const { plots } = await pineTS.run(
`//@version=5
indicator("barmerge enum test")
// These use barmerge.gaps_off / barmerge.lookahead_off (string enums)
float dc_enum = request.security(syminfo.tickerid, "D", close, barmerge.gaps_off, barmerge.lookahead_off)
// These pass boolean false directly
float dc_bool = request.security(syminfo.tickerid, "D", close, false, false)
plot(dc_enum, "enum")
plot(dc_bool, "bool")
`);

        const enumData = extractPlot(plots, 'enum', sDate, eDate);
        const boolData = extractPlot(plots, 'bool', sDate, eDate);

        expect(enumData.length).toBeGreaterThan(0);
        expect(enumData.length).toBe(boolData.length);

        // Every value from string enum path must match boolean path exactly
        for (let i = 0; i < enumData.length; i++) {
            expect(enumData[i].value).toBe(boolData[i].value);
            expect(enumData[i].time).toBe(boolData[i].time);
        }

        // Verify none are NaN
        for (const d of enumData) {
            expect(isNaN(d.value)).toBe(false);
        }
    }, 30000);
});

// ── Cross-TF correctness against TradingView reference data ────────────────────

describe('request.security Cross-TF Correctness', () => {
    // Helper: extract plot data as { time, value }[] filtered to date range
    function extractPlot(
        plots: any,
        name: string,
        sDate: number,
        eDate: number,
    ): { time: string; value: any }[] {
        const plotdata = plots[name]?.data || [];
        return plotdata
            .filter((e: any) => e.time >= sDate && e.time <= eDate)
            .map((e: any) => ({
                time: new Date(e.time).toISOString().slice(0, 10),
                value: e.value,
            }));
    }

    // TradingView reference values captured from BTCUSDC Weekly chart
    // requesting Daily data with barmerge.gaps_off, barmerge.lookahead_off
    const TV_WEEKLY_REFERENCE = [
        { time: '2019-01-07', dailyClose: 3509.21, dailyHigh: 3652.00, dailyClose1: 3616.15 },
        { time: '2019-01-14', dailyClose: 3535.79, dailyHigh: 3706.62, dailyClose1: 3682.09 },
        { time: '2019-01-21', dailyClose: 3531.36, dailyHigh: 3565.00, dailyClose1: 3552.93 },
        { time: '2019-01-28', dailyClose: 3413.46, dailyHigh: 3474.21, dailyClose1: 3465.05 },
        { time: '2019-02-04', dailyClose: 3651.57, dailyHigh: 3652.61, dailyClose1: 3626.54 },
    ];

    it('Weekly chart requesting Daily close/high/close[1] should match TradingView', async () => {
        const sDate = new Date('2019-01-07').getTime();
        const eDate = new Date('2019-02-10').getTime();
        const warmup = 365 * 24 * 60 * 60 * 1000;

        const pineTS = new PineTS(Provider.Binance, 'BTCUSDC', 'W', null, sDate - warmup, eDate);

        const { plots } = await pineTS.run(
`//@version=5
indicator("Cross-TF W->D")
float dailyClose  = request.security(syminfo.tickerid, "D", close, barmerge.gaps_off, barmerge.lookahead_off)
float dailyHigh   = request.security(syminfo.tickerid, "D", high, barmerge.gaps_off, barmerge.lookahead_off)
float dailyClose1 = request.security(syminfo.tickerid, "D", close[1], barmerge.gaps_off, barmerge.lookahead_off)
plot(dailyClose, "dc")
plot(dailyHigh, "dh")
plot(dailyClose1, "dc1")
`);

        const dcData = extractPlot(plots, 'dc', sDate, new Date('2019-02-05').getTime());
        const dhData = extractPlot(plots, 'dh', sDate, new Date('2019-02-05').getTime());
        const dc1Data = extractPlot(plots, 'dc1', sDate, new Date('2019-02-05').getTime());

        expect(dcData.length).toBe(TV_WEEKLY_REFERENCE.length);

        for (let i = 0; i < TV_WEEKLY_REFERENCE.length; i++) {
            const ref = TV_WEEKLY_REFERENCE[i];
            expect(dcData[i].time).toBe(ref.time);
            expect(dcData[i].value).toBeCloseTo(ref.dailyClose, 1);
            expect(dhData[i].value).toBeCloseTo(ref.dailyHigh, 1);
            expect(dc1Data[i].value).toBeCloseTo(ref.dailyClose1, 1);
        }
    }, 30000);

    it('1h chart requesting Daily should produce valid values (no NaN) with canonical TF', async () => {
        const sDate = new Date('2019-01-07').getTime();
        const eDate = new Date('2019-01-10').getTime();

        // '60' is the canonical 1h timeframe
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDC', '60', null, sDate, eDate);

        const { plots } = await pineTS.run(
`//@version=5
indicator("Cross-TF 1h->D")
float dailyClose = request.security(syminfo.tickerid, "D", close, barmerge.gaps_off, barmerge.lookahead_off)
plot(dailyClose, "dc")
`);

        const dcData = extractPlot(plots, 'dc', sDate, eDate);

        // Should have hourly bars (at least 48 for 2 full days)
        expect(dcData.length).toBeGreaterThan(48);

        // No values should be NaN (this was the bug before the fix)
        const nanCount = dcData.filter(d => isNaN(d.value)).length;
        expect(nanCount).toBe(0);

        // All values should be positive (valid BTC prices)
        for (const d of dcData) {
            expect(d.value).toBeGreaterThan(0);
        }
    }, 30000);

    it('normalizeTimeframe produces correct isLTF determination in security.ts', () => {
        // The normalizeTimeframe fix ensures that non-canonical formats like '1h', '4h'
        // are mapped to canonical ('60', '240') before TIMEFRAMES.indexOf() comparison.
        // Without this fix, TIMEFRAMES.indexOf('1h') returns -1 and throws Error.

        // Simulate what security.ts does on lines 41-42:
        const ctxTF_canonical = '60';           // canonical 1h
        const ctxTF_nonCanonical = '1h';        // non-canonical 1h
        const reqTF = 'D';                      // requesting Daily

        const ctxIdx_canonical = TIMEFRAMES.indexOf(normalizeTimeframe(ctxTF_canonical));
        const ctxIdx_nonCanonical = TIMEFRAMES.indexOf(normalizeTimeframe(ctxTF_nonCanonical));
        const reqIdx = TIMEFRAMES.indexOf(normalizeTimeframe(reqTF));

        // Both should resolve to the same index
        expect(ctxIdx_canonical).toBe(ctxIdx_nonCanonical);
        expect(ctxIdx_canonical).not.toBe(-1);
        expect(reqIdx).not.toBe(-1);

        // 1h < Daily → isLTF = false (HTF request)
        const isLTF = ctxIdx_canonical > reqIdx;
        expect(isLTF).toBe(false);

        // Weekly > Daily → isLTF = true (LTF request)
        const weeklyIdx = TIMEFRAMES.indexOf(normalizeTimeframe('W'));
        const isLTF_weekly = weeklyIdx > reqIdx;
        expect(isLTF_weekly).toBe(true);

        // Non-canonical formats should also work
        expect(TIMEFRAMES.indexOf(normalizeTimeframe('4h'))).toBe(TIMEFRAMES.indexOf('240'));
        expect(TIMEFRAMES.indexOf(normalizeTimeframe('6h'))).toBe(TIMEFRAMES.indexOf('360'));
        expect(TIMEFRAMES.indexOf(normalizeTimeframe('8h'))).toBe(TIMEFRAMES.indexOf('480'));
        expect(TIMEFRAMES.indexOf(normalizeTimeframe('12h'))).toBe(TIMEFRAMES.indexOf('720'));
        expect(TIMEFRAMES.indexOf(normalizeTimeframe('1w'))).toBe(TIMEFRAMES.indexOf('W'));
        expect(TIMEFRAMES.indexOf(normalizeTimeframe('1d'))).toBe(TIMEFRAMES.indexOf('D'));

        // 6h/8h/12h should sit between 4h (240) and Daily (D)
        const idx4h = TIMEFRAMES.indexOf('240');
        const idx6h = TIMEFRAMES.indexOf('360');
        const idx8h = TIMEFRAMES.indexOf('480');
        const idx12h = TIMEFRAMES.indexOf('720');
        const idxD = TIMEFRAMES.indexOf('D');

        expect(idx6h).toBeGreaterThan(idx4h);
        expect(idx8h).toBeGreaterThan(idx6h);
        expect(idx12h).toBeGreaterThan(idx8h);
        expect(idxD).toBeGreaterThan(idx12h);
    });

    it('360 (6h) chart requesting Daily with request.security should execute without throwing Invalid timeframe', async () => {
        const bar = (t: number) => ({
            openTime: t,
            closeTime: t + 21599999,
            open: 100,
            high: 101,
            low: 99,
            close: 100.5,
            volume: 10,
        });
        const make = (n: number, ms: number) =>
            Array.from({ length: n }, (_, i) => bar(1700000000000 + i * ms));

        const datasets: Record<string, any[]> = {
            '360': make(50, 21600e3),
            'D': make(50, 86400e3),
        };
        const mockProvider = {
            async getMarketData(_t: any, tf: string) {
                if (!datasets[tf]) throw new Error(`no data for ${tf}`);
                return datasets[tf];
            },
            async getSymbolInfo() {
                return {
                    ticker: 'BTCUSDT',
                    tickerid: 'BINANCE:BTCUSDT',
                    type: 'crypto',
                    currency: 'USDT',
                    mintick: 0.01,
                    pointvalue: 1,
                    timezone: 'UTC',
                };
            },
            configure() {},
        };

        const mtf = `//@version=5
indicator("mtf 6h")
float dClose = request.security(syminfo.tickerid, "D", close)
plot(dClose, "dc")
`;

        const pineTS = new PineTS(mockProvider as any, 'BINANCE:BTCUSDT', '360', 50);
        const { plots } = await pineTS.run(mtf);

        expect(plots['dc']).toBeDefined();
        expect(plots['dc'].data.length).toBeGreaterThan(0);
    });
});
