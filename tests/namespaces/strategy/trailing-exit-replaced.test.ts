// SPDX-License-Identifier: AGPL-3.0-only
// A strategy.exit re-called with the same id replaces the pending exit. Measured on TradingView
// (Pine v6, BINANCE:BTCUSDT 1h, trades from 2026-09-01 to 2026-10-04, every closed trade compared):
//   - a re-call that moves the activation level (trail_price / trail_points) is a new trailing order:
//     its trail starts over (`trail_price = close` re-called every bar: 191 trades, the first long
//     exiting at the previous close minus the offset, 78,979.99, not the previous high minus it);
//   - a re-call with the same activation level keeps the running peak, whatever else changes
//     (fixed trail_points / trail_price, a changing trail_offset or loss).

import { describe, it, expect } from 'vitest';
import { PineTS, Indicator } from '../../../src';

type Bar = [number, number, number, number]; // open, high, low, close

async function run(body: string, ohlc: Bar[]) {
    const bars = ohlc.map(([open, high, low, close], i) => ({ openTime: (i + 1) * 3_600_000, closeTime: (i + 2) * 3_600_000 - 1, open, high, low, close, volume: 1 }));
    const sym = { tickerid: 'TEST:X', ticker: 'X', root: 'X', prefix: 'TEST', type: 'crypto' as const, currency: 'USD', timezone: 'UTC', mintick: 0.01, pointvalue: 1, mincontract: 0.001, minmove: 1, pricescale: 100, session: '24x7', description: 'X' };
    const provider = { configure() {}, getSymbolInfo: async () => sym, getMarketData: async () => bars };
    const src = `//@version=6
strategy("trail", default_qty_type = strategy.fixed, default_qty_value = 1, margin_long = 0, margin_short = 0)
if bar_index == 0
    strategy.entry("L", strategy.long)
${body}`;
    const ctx = await new PineTS(provider, 'TEST:X', '60', bars.length, undefined, bars[bars.length - 1].closeTime).run(new Indicator(src));
    return ctx.strategy!;
}

// Entry at the 100 open of bar 1. Bar 2 runs to 103 and closes at 102 without reaching any trigger;
// bar 3 opens at its high (102) and falls to 99.
const bars: Bar[] = [
    [100, 100.5, 99.5, 100],
    [100, 101, 99.9, 100.8],
    [100.8, 103, 101.5, 102],
    [102, 102, 99, 99.5],
    [99.5, 100, 99, 99.5],
];

describe('strategy.exit re-called with the same id', () => {
    it('a new trail_price restarts the trail from the new level', async () => {
        // re-placed at bar 2's close (102): active from that close, 200 ticks behind it → 100.00
        // (the replaced order's peak, 103, would fill at 101.00)
        const s = await run(
            `if strategy.position_size > 0
    strategy.exit("X", "L", trail_price = close, trail_offset = 200)`,
            bars,
        );
        expect(s.closedtrades.map((t) => [t.exit_bar_index, t.exit_price])).toEqual([[3, 100]]);
    });

    it('a new trail_points restarts the trail', async () => {
        // trail_points 20 → 10 ticks: the activation moves, so the order re-arms at bar 2's close (102) → 100.00
        const s = await run(
            `if strategy.position_size > 0
    strategy.exit("X", "L", trail_points = bar_index == 1 ? 20 : 10, trail_offset = 200)`,
            bars,
        );
        expect(s.closedtrades.map((t) => [t.exit_bar_index, t.exit_price])).toEqual([[3, 100]]);
    });

    it('the same trail_points keeps the running peak', async () => {
        // armed at bar 1's close; the peak runs to bar 2's 103 high and survives the re-call → 101.00
        const s = await run(
            `if strategy.position_size > 0
    strategy.exit("X", "L", trail_points = 10, trail_offset = 200)`,
            bars,
        );
        expect(s.closedtrades.map((t) => [t.exit_bar_index, t.exit_price])).toEqual([[3, 101]]);
    });

    it('the same trail_price keeps the running peak when only the offset changes', async () => {
        // peak 103 kept; the offset re-placed at bar 2 is 250 ticks → 100.50 (a restart would give 99.50)
        const s = await run(
            `if strategy.position_size > 0
    strategy.exit("X", "L", trail_price = 100.5, trail_offset = bar_index == 1 ? 200 : 250)`,
            bars,
        );
        expect(s.closedtrades.map((t) => [t.exit_bar_index, t.exit_price])).toEqual([[3, 100.5]]);
    });

    it('the same trail_price keeps the running peak even when its tick rounding follows the close', async () => {
        // 100.505 works at 100.51 below the bar-1 close of 100.40 and at 100.50 above the bar-2 close:
        // the passed value is unchanged, so the peak (103) is kept → 101.00
        const s = await run(
            `if strategy.position_size > 0
    strategy.exit("X", "L", trail_price = 100.505, trail_offset = 200)`,
            [bars[0], [100, 100.6, 99.9, 100.4], ...bars.slice(2)],
        );
        expect(s.closedtrades.map((t) => [t.exit_bar_index, t.exit_price])).toEqual([[3, 101]]);
    });
});
