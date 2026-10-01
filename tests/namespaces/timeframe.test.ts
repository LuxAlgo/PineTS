import { describe, expect, it } from 'vitest';
import PineTS from '../../src/PineTS.class';
// import { Provider } from '../../src/marketData/Provider.class';

describe('Timeframe Namespace', () => {
    // Helper to run code on a specific timeframe using manual data to avoid file system checks
    const runOnTimeframe = async (tf: string, code: (context: any) => any) => {
        const sDate = new Date('2020-01-01').getTime();
        const eDate = new Date('2020-01-05').getTime();

        // Mock data array directly
        const mockData = [
            { open: 10, high: 20, low: 5, close: 15, volume: 100, openTime: sDate, closeTime: sDate + 1000 },
            { open: 15, high: 25, low: 10, close: 20, volume: 200, openTime: sDate + 86400000, closeTime: sDate + 86400000 + 1000 },
        ];

        // Pass mockData as source (any[]), so loadMarketData returns it directly without Provider
        // But we still need to pass 'tf' as timeframe to constructor so context.timeframe is set correctly
        const pineTS = new PineTS(mockData, 'BTCUSDC', tf, null, sDate, eDate);

        const resultContext = await pineTS.run(code);
        return resultContext.result;
    };

    const last = (arr: any[]) => {
        if (!arr || arr.length === 0) return undefined;
        return arr[arr.length - 1];
    };

    it('should handle daily timeframe properties correctly', async () => {
        const result = await runOnTimeframe('D', (context) => {
            const { timeframe } = context.pine;
            return {
                isseconds: timeframe.isseconds,
                isminutes: timeframe.isminutes,
                isintraday: timeframe.isintraday,
                isdaily: timeframe.isdaily,
                isweekly: timeframe.isweekly,
                ismonthly: timeframe.ismonthly,
                isdwm: timeframe.isdwm,
                multiplier: timeframe.multiplier,
                period: timeframe.period,
            };
        });

        expect(result).toBeDefined();
        expect(last(result.isseconds)).toBe(false);
        expect(last(result.isminutes)).toBe(false);
        expect(last(result.isintraday)).toBe(false);
        expect(last(result.isdaily)).toBe(true);
        expect(last(result.isweekly)).toBe(false);
        expect(last(result.ismonthly)).toBe(false);
        expect(last(result.isdwm)).toBe(true);
        expect(last(result.multiplier)).toBe(1);
        expect(last(result.period)).toBe('D');
    });

    it('should handle intraday (minute) properties correctly', async () => {
        const result = await runOnTimeframe('15', (context) => {
            const { timeframe } = context.pine;
            return {
                isseconds: timeframe.isseconds,
                isminutes: timeframe.isminutes,
                isintraday: timeframe.isintraday,
                isdaily: timeframe.isdaily,
                isdwm: timeframe.isdwm,
                multiplier: timeframe.multiplier,
                period: timeframe.period,
            };
        });

        expect(result).toBeDefined();
        expect(last(result.isseconds)).toBe(false);
        expect(last(result.isminutes)).toBe(true);
        expect(last(result.isintraday)).toBe(true);
        expect(last(result.isdaily)).toBe(false);
        expect(last(result.isdwm)).toBe(false);
        expect(last(result.multiplier)).toBe(15);
        expect(last(result.period)).toBe('15');
    });

    it('should handle seconds timeframe properties correctly', async () => {
        const result = await runOnTimeframe('30S', (context) => {
            const { timeframe } = context.pine;
            return {
                isseconds: timeframe.isseconds,
                isminutes: timeframe.isminutes,
                isintraday: timeframe.isintraday,
                multiplier: timeframe.multiplier,
                period: timeframe.period,
            };
        });

        expect(result).toBeDefined();
        expect(last(result.isseconds)).toBe(true);
        expect(last(result.isminutes)).toBe(false);
        expect(last(result.isintraday)).toBe(true);
        expect(last(result.multiplier)).toBe(30);
        expect(last(result.period)).toBe('30S');
    });

    it('should handle weekly timeframe properties correctly', async () => {
        const result = await runOnTimeframe('W', (context) => {
            const { timeframe } = context.pine;
            return {
                isweekly: timeframe.isweekly,
                isdwm: timeframe.isdwm,
                isintraday: timeframe.isintraday,
            };
        });

        expect(result).toBeDefined();
        expect(last(result.isweekly)).toBe(true);
        expect(last(result.isdwm)).toBe(true);
        expect(last(result.isintraday)).toBe(false);
    });

    it('should handle monthly timeframe properties correctly', async () => {
        const result = await runOnTimeframe('M', (context) => {
            const { timeframe } = context.pine;
            return {
                ismonthly: timeframe.ismonthly,
                isdwm: timeframe.isdwm,
                isintraday: timeframe.isintraday,
            };
        });

        expect(result).toBeDefined();
        expect(last(result.ismonthly)).toBe(true);
        expect(last(result.isdwm)).toBe(true);
        expect(last(result.isintraday)).toBe(false);
    });

    it('should convert from seconds to timeframe string', async () => {
        const result = await runOnTimeframe('D', (context) => {
            const { timeframe } = context.pine;
            return {
                tf_1min: timeframe.from_seconds(60),
                tf_5min: timeframe.from_seconds(300),
                tf_1hour: timeframe.from_seconds(3600),
                tf_1day: timeframe.from_seconds(86400),
                tf_1week: timeframe.from_seconds(86400 * 7),
                tf_custom_sec: timeframe.from_seconds(30),
            };
        });

        expect(result).toBeDefined();
        // Minutes are timeframe strings on TradingView, not numbers
        expect(last(result.tf_1min)).toBe('1');
        expect(last(result.tf_5min)).toBe('5');
        expect(last(result.tf_1hour)).toBe('60');
        // 86400s -> 1D
        expect(last(result.tf_1day)).toBe('1D');
        // 1 week -> 1W
        expect(last(result.tf_1week)).toBe('1W');
        // 30s -> 30S
        expect(last(result.tf_custom_sec)).toBe('30S');
    });

    it('should convert timeframe string to seconds', async () => {
        const result = await runOnTimeframe('D', (context) => {
            const { timeframe } = context.pine;
            return {
                sec_1min: timeframe.in_seconds('1'),
                sec_5min: timeframe.in_seconds('5'),
                sec_1D: timeframe.in_seconds('1D'),
                sec_1W: timeframe.in_seconds('1W'),
                sec_1M: timeframe.in_seconds('1M'),
                sec_30S: timeframe.in_seconds('30S'),
                // Testing explicit minute handling if applicable or minutes
                sec_60min: timeframe.in_seconds('60'),
            };
        });

        expect(result).toBeDefined();
        expect(last(result.sec_1min)).toBe(60);
        expect(last(result.sec_5min)).toBe(300);
        expect(last(result.sec_1D)).toBe(86400);
        expect(last(result.sec_1W)).toBe(604800);
        expect(last(result.sec_1M)).toBe(2628003); // TradingView: 365 / 12 days
        expect(last(result.sec_30S)).toBe(30);
        expect(last(result.sec_60min)).toBe(3600);
    });
});
