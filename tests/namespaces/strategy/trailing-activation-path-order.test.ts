import { describe, expect, it } from 'vitest';

import { PineTS } from 'index';

/**
 * TradingView parity for strategy.exit() trailing stops — three behaviours that
 * were previously off:
 *
 *  1. Immediate activation. When `trail_price` is already behind the market at
 *     placement (a common idiom is a far-away sentinel like 1 for longs), TV
 *     activates the trail at once with the peak at the placing bar's close.
 *     The engine used to wait for a LATER bar to touch the level and then seed
 *     the peak at that bar's extreme (one bar late, optimistic).
 *  2. Gap-through. An armed trail whose standing trigger is already past the
 *     bar's open fills at the open, like any other stop.
 *  3. Path order across legs and across orders. Along the adverse move the
 *     level nearest the open is reached first, whichever leg or ORDER it
 *     belongs to. The engine used to fire SL before trail, and to process
 *     orders one at a time (an older hard-stop order could close the position
 *     at a level the path reaches only after another order's trail level).
 */

class LocalProvider {
    constructor(private bars: any[]) {}
    configure() {}
    async getMarketData() {
        return this.bars;
    }
    async getSymbolInfo() {
        return {
            ticker: 'TEST',
            prefix: 'X',
            tickerid: 'X:TEST',
            type: 'stock',
            timezone: 'America/New_York',
            currency: 'USD',
            mintick: 0.01,
            minmove: 1,
            pricescale: 100,
            pointvalue: 1,
            session: '0930-1600',
        };
    }
}

const DAY = 86_400_000;
const T0 = Date.UTC(2024, 0, 2, 14, 30);
const bar = (i: number, open: number, high: number, low: number, close: number) => ({
    openTime: T0 + i * DAY,
    open,
    high,
    low,
    close,
    volume: 0,
    closeTime: T0 + i * DAY + 6.5 * 3_600_000,
});

function flatBars(n: number) {
    const out: any[] = [];
    for (let i = 0; i < n; i++) out.push(bar(i, 100, 101, 99, 100));
    return out;
}

const HEADER = `//@version=6
strategy("T", initial_capital=100000, default_qty_type=strategy.percent_of_equity, default_qty_value=100)
if bar_index == 2
    strategy.entry("L", strategy.long)
`;

async function run(bars: any[], body: string) {
    const ctx: any = await new PineTS(new LocalProvider(bars) as any, 'X:TEST', '1D').run(HEADER + body);
    return ctx.strategy.closedtrades;
}

describe('Strategy - trailing stop activation and path order (TradingView parity)', () => {
    it('activates a trail whose trail_price is already reached and fills the next bar gap-through at the open', async () => {
        const bars = flatBars(10); // bars 0..9 flat at 100; entry fills bar 3 @ 100
        bars.push(bar(10, 100, 101, 99, 100)); // trail placed at this close: level 100 (reached), offset 30 ticks -> 99.70
        bars.push(bar(11, 98.5, 99.2, 98.0, 99.0)); // gaps through 99.70 -> TV fills at the open 98.5
        bars.push(bar(12, 103, 104, 102.5, 103.5)); // engine used to fill HERE at 103.70 (peak 104 - 0.30)
        for (let i = 13; i < 20; i++) bars.push(bar(i, 101, 102, 100, 101));
        const trades = await run(
            bars,
            `if bar_index >= 10 and strategy.position_size > 0
    strategy.exit("X", from_entry="L", trail_price = close, trail_offset = 30, comment_trailing = "TRL")
`,
        );
        expect(trades).toHaveLength(1);
        expect(trades[0].exit_bar_index).toBe(11);
        expect(trades[0].exit_price).toBeCloseTo(98.5, 6);
        expect(trades[0].exit_comment).toBe('TRL');
    });

    it('fires the trailing leg before the stop leg of the same order when the path reaches it first', async () => {
        const bars = flatBars(10);
        bars.push(bar(10, 100, 101, 99, 100)); // exit placed: stop 95, trail from 100 with 100 ticks -> 99
        bars.push(bar(11, 99.5, 100.2, 94, 95)); // favorable-first: peak -> 100.2, trigger 99.2 is reached before 95
        for (let i = 12; i < 16; i++) bars.push(bar(i, 95, 96, 94, 95));
        const trades = await run(
            bars,
            `if bar_index >= 10 and strategy.position_size > 0
    strategy.exit("X", from_entry="L", stop = 95, trail_price = close, trail_offset = 100, comment_loss = "SL", comment_trailing = "TRL")
`,
        );
        expect(trades).toHaveLength(1);
        expect(trades[0].exit_bar_index).toBe(11);
        expect(trades[0].exit_comment).toBe('TRL');
        expect(trades[0].exit_price).toBeCloseTo(99.2, 6);
    });

    it('orders the legs of DIFFERENT exit orders along the bar path, not order by order', async () => {
        const bars = flatBars(10);
        bars.push(bar(10, 100, 101, 99, 100)); // two orders: an older hard stop at 95 and a trail (100 - 1.00 = 99)
        bars.push(bar(11, 99.5, 105.5, 94, 95)); // adverse-first (open nearer the low): 99 is hit before 95 on the way down
        for (let i = 12; i < 16; i++) bars.push(bar(i, 95, 96, 94, 95));
        const trades = await run(
            bars,
            `if bar_index >= 3 and strategy.position_size > 0
    strategy.exit("HARD", from_entry="L", stop = 95, comment_loss = "HARD")
if bar_index >= 10 and strategy.position_size > 0
    strategy.exit("TRAIL", from_entry="L", trail_price = close, trail_offset = 100, comment_trailing = "TRL")
`,
        );
        expect(trades).toHaveLength(1);
        expect(trades[0].exit_bar_index).toBe(11);
        expect(trades[0].exit_comment).toBe('TRL');
        expect(trades[0].exit_price).toBeCloseTo(99, 6);
    });
});
