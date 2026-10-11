import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';

/**
 * Same-bar exit bugs when entry fills intrabar:
 * (A) TP fills at bar open even though open happened before entry
 * (B) TP ignores intrabar path and fills even though TP is only reachable before entry
 * 
 * TradingView's intrabar path with Bar Magnifier off:
 * - open closer to high: O -> H -> L -> C (favorable first for longs)
 * - open closer to low:  O -> L -> H -> C (adverse first for longs)
 */
describe('strategy same-bar exit intrabar path bugs', () => {
    const T0 = Date.UTC(2026, 0, 5, 15, 0);
    
    function makeBar(open: number, high: number, low: number, close: number, index: number) {
        const time = T0 + index * 60000;
        return {
            openTime: time,
            closeTime: time + 59999,
            time,
            open,
            high,
            low,
            close,
            volume: 1,
        };
    }

    const symbol = {
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

    function mkProvider(bars: any[]) {
        return {
            configure() {},
            getSymbolInfo: async () => symbol,
            getMarketData: async () => bars,
        };
    }

    /**
     * Bug A: TP fills at open price when entry fills intrabar, even though
     * open happened before entry existed.
     * 
     * Bar 1: O=100, H=101, L=94, C=100.5
     * Path: O(100) -> H(101) -> L(94) -> C(100.5)
     * 
     * Long limit entry @ 95 fills on the path from H to L.
     * TP @ 99 is crossed at 99 on the way back up from L to C.
     * 
     * Expected: exit @ 99 (TP price)
     * Actual:   exit @ 100 (open price) - BUG
     * 
     * The open (100) happened BEFORE the entry filled (95), so the exit
     * can't fill at the open. It should fill at the TP price (99).
     * 
     * TradingView evidence (MNQ1! 1m, 2026-02-04 09:36 PT):
     * Short x15 @ 25379.75, TP @ 25359.75, TV filled @ 25359.75,
     * old PineTS filled @ 25344.5 (the open).
     */
    it('bug A: same-bar TP should not fill at open for intrabar entry', async () => {
        const bars = [
            makeBar(100, 100.5, 99.5, 100, 0), // quiet bar
            makeBar(100, 101, 94, 100.5, 1),   // entry and TP same bar
            makeBar(100, 100.5, 99.5, 100, 2), // quiet bar
        ];

        const script = `//@version=6
strategy("Bug A", overlay = true, default_qty_type = strategy.fixed, default_qty_value = 1, slippage = 0, margin_long = 0, margin_short = 0)
if bar_index == 0
    strategy.entry("L", strategy.long, limit = 95)
    strategy.exit("X", "L", stop = 80, limit = 99)
`;
        
        const pineTS = new PineTS(mkProvider(bars), 'TEST:X', '1', bars.length, undefined, bars[bars.length - 1].closeTime);
        const ctx = await pineTS.run(script);
        
        expect(ctx.strategy?.closedtrades).toBeDefined();
        expect(ctx.strategy.closedtrades.length).toBe(1);
        
        const trade = ctx.strategy.closedtrades[0];
        expect(trade.entry_bar_index).toBe(1);
        expect(trade.entry_price).toBeCloseTo(95, 8);
        expect(trade.exit_bar_index).toBe(1);
        
        // Expected: TP @ 99, not open @ 100
        expect(trade.exit_price).toBeCloseTo(99, 8);
    });

    /**
     * Bug B: TP ignores intrabar path and fills even though TP is only
     * reachable BEFORE the entry fills.
     * 
     * Bar 1: O=100, H=102, L=94, C=95
     * Path: O(100) -> H(102) -> L(94) -> C(95)
     * 
     * Open (100) is closer to high (102) than to low (94), so path is
     * O -> H -> L -> C (favorable first for longs).
     * 
     * Long limit entry @ 95 fills on the path from H to L (when price
     * descends through 95).
     * TP @ 101 was touched during O -> H phase, but that's BEFORE the
     * entry filled. After the entry at 95, price only goes down to 94
     * then back up to 95 (close), never reaching 101 again.
     * 
     * Expected: exit on next bar when price reaches 101
     * Actual:   exit on entry bar @ 101 - BUG
     * 
     * TradingView evidence (2025-11-02 23:30 PT):
     * A trade where TV exits first TP at 23:34 @ 26078.75,
     * but PineTS exits on entry bar 23:30.
     */
    it('bug B: same-bar TP should respect intrabar path after entry', async () => {
        const bars = [
            makeBar(100, 100.5, 99.5, 100, 0),  // quiet bar
            makeBar(100, 102, 94, 95, 1),       // entry bar, TP only touched before entry
            makeBar(95, 101.5, 94.5, 101, 2),   // TP reached on next bar
            makeBar(101, 101.5, 100.5, 101, 3), // quiet bar
        ];

        const script = `//@version=6
strategy("Bug B", overlay = true, default_qty_type = strategy.fixed, default_qty_value = 1, slippage = 0, margin_long = 0, margin_short = 0)
if bar_index == 0
    strategy.entry("L", strategy.long, limit = 95)
    strategy.exit("X", "L", stop = 80, limit = 101)
`;
        
        const pineTS = new PineTS(mkProvider(bars), 'TEST:X', '1', bars.length, undefined, bars[bars.length - 1].closeTime);
        const ctx = await pineTS.run(script);
        
        expect(ctx.strategy?.closedtrades).toBeDefined();
        expect(ctx.strategy.closedtrades.length).toBe(1);
        
        const trade = ctx.strategy.closedtrades[0];
        expect(trade.entry_bar_index).toBe(1);
        expect(trade.entry_price).toBeCloseTo(95, 8);
        
        // Expected: exit on bar 2 @ 101, not on entry bar 1
        expect(trade.exit_bar_index).toBe(2);
        expect(trade.exit_price).toBeCloseTo(101, 8);
    });
});
