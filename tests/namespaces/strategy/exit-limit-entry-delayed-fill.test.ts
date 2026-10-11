import { describe, it, expect } from 'vitest';
import { PineTS, Indicator } from '../../../src';

describe('strategy.exit with delayed limit entry fill', () => {
    it('should keep exit order pending until its entry fills (2+ bars later)', async () => {
        // Reproduces bug: exit order placed on bar 0 for a limit entry that fills on bar 3
        // should wait for the entry to fill, not get cancelled on bars 1-2 when no trade exists yet
        const bars = [
            { openTime: 1000, closeTime: 1999, time: 1000, open: 100, high: 100.5, low: 99.5, close: 100, volume: 1 },
            { openTime: 2000, closeTime: 2999, time: 2000, open: 100, high: 100.5, low: 99.5, close: 100, volume: 1 },
            { openTime: 3000, closeTime: 3999, time: 3000, open: 99, high: 99.5, low: 98.5, close: 99, volume: 1 },
            { openTime: 4000, closeTime: 4999, time: 4000, open: 99, high: 99.5, low: 94, close: 96, volume: 1 }, // entry fills at 95
            { openTime: 5000, closeTime: 5999, time: 5000, open: 100, high: 111, low: 99.5, close: 105, volume: 1 }, // exit should trigger at 110
            { openTime: 6000, closeTime: 6999, time: 6000, open: 105, high: 105.5, low: 104.5, close: 105, volume: 1 },
            { openTime: 7000, closeTime: 7999, time: 7000, open: 105, high: 105.5, low: 104.5, close: 105, volume: 1 },
        ];

        const sym = {
            tickerid: 'TEST:X',
            ticker: 'X',
            root: 'X',
            prefix: 'TEST',
            type: 'futures' as const,
            currency: 'USD',
            timezone: 'UTC',
            mintick: 0.25,
            pointvalue: 1,
            mincontract: 1,
            minmove: 1,
            pricescale: 4,
            session: '24x7',
            description: 'X',
        };

        const provider = {
            configure() {},
            getSymbolInfo: async () => sym,
            getMarketData: async () => bars,
        };

        const src = `//@version=6
strategy("Exit Waits for Entry", overlay = true, default_qty_type = strategy.fixed, default_qty_value = 1, slippage = 0, margin_long = 0, margin_short = 0, pyramiding = 1)

if bar_index == 0
    strategy.entry("L", strategy.long, limit = 95)
    strategy.exit("X", "L", stop = 90, limit = 110)
`;

        const ctx = await new PineTS(provider, 'TEST:X', '1', bars.length, undefined, bars[bars.length - 1].closeTime).run(
            new Indicator(src)
        );

        // TradingView behavior: the exit order waits for the entry to fill on bar 3,
        // then triggers on bar 4 when price reaches 110
        expect(ctx.strategy?.closedtrades).toBeDefined();
        expect(ctx.strategy?.closedtrades.length).toBe(1);

        const trade = ctx.strategy!.closedtrades[0];
        expect(trade.entry_bar_index).toBe(3); // entry fills on bar 3
        expect(trade.entry_price).toBeCloseTo(95, 8);
        expect(trade.exit_bar_index).toBe(4); // exit triggers on bar 4
        expect(trade.exit_price).toBeCloseTo(110, 8);
        expect(trade.exit_id).toBe('X');

        // No open trades should remain
        expect(ctx.strategy?.opentrades.length).toBe(0);
    });

    it('should handle multiple bars before entry fills', async () => {
        // More extreme case: 5 bars before entry fills
        const bars = [
            { openTime: 1000, closeTime: 1999, time: 1000, open: 100, high: 100.5, low: 99.5, close: 100, volume: 1 },
            { openTime: 2000, closeTime: 2999, time: 2000, open: 100, high: 100.5, low: 99.5, close: 100, volume: 1 },
            { openTime: 3000, closeTime: 3999, time: 3000, open: 100, high: 100.5, low: 99.5, close: 100, volume: 1 },
            { openTime: 4000, closeTime: 4999, time: 4000, open: 100, high: 100.5, low: 99.5, close: 100, volume: 1 },
            { openTime: 5000, closeTime: 5999, time: 5000, open: 100, high: 100.5, low: 99.5, close: 100, volume: 1 },
            { openTime: 6000, closeTime: 6999, time: 6000, open: 99, high: 99.5, low: 94, close: 96, volume: 1 }, // bar 5: entry fills at 95
            { openTime: 7000, closeTime: 7999, time: 7000, open: 100, high: 111, low: 99.5, close: 105, volume: 1 }, // bar 6: exit at 110
        ];

        const sym = {
            tickerid: 'TEST:X',
            ticker: 'X',
            root: 'X',
            prefix: 'TEST',
            type: 'futures' as const,
            currency: 'USD',
            timezone: 'UTC',
            mintick: 0.25,
            pointvalue: 1,
            mincontract: 1,
            minmove: 1,
            pricescale: 4,
            session: '24x7',
            description: 'X',
        };

        const provider = {
            configure() {},
            getSymbolInfo: async () => sym,
            getMarketData: async () => bars,
        };

        const src = `//@version=6
strategy("Exit Waits 5 Bars", overlay = true, default_qty_type = strategy.fixed, default_qty_value = 1, slippage = 0, margin_long = 0, margin_short = 0, pyramiding = 1)

if bar_index == 0
    strategy.entry("L", strategy.long, limit = 95)
    strategy.exit("X", "L", stop = 90, limit = 110)
`;

        const ctx = await new PineTS(provider, 'TEST:X', '1', bars.length, undefined, bars[bars.length - 1].closeTime).run(
            new Indicator(src)
        );

        expect(ctx.strategy?.closedtrades).toBeDefined();
        expect(ctx.strategy?.closedtrades.length).toBe(1);

        const trade = ctx.strategy!.closedtrades[0];
        expect(trade.entry_bar_index).toBe(5); // entry fills on bar 5
        expect(trade.entry_price).toBeCloseTo(95, 8);
        expect(trade.exit_bar_index).toBe(6); // exit triggers on bar 6
        expect(trade.exit_price).toBeCloseTo(110, 8);
        expect(trade.exit_id).toBe('X');
        expect(ctx.strategy?.opentrades.length).toBe(0);
    });
});
