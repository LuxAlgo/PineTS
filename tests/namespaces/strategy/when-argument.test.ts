// SPDX-License-Identifier: AGPL-3.0-only
// The `when` argument of the order commands (Pine v5; deprecated there and removed in v6): the call
// only acts on bars where `when` is true. False or na does nothing, and an order already placed under
// the same id is kept. Before the fix the argument was dropped, so `strategy.entry(..., when = cond)`
// placed an order on every bar.

import { describe, it, expect } from 'vitest';
import { PineTS, Indicator } from '../../../src';

function run(body: string, n = 10) {
    // Rising bars: open below close, so a long filled at a bar's open is in profit by its close.
    const bars = Array.from({ length: n }, (_, i) => {
        const c = 100 + i;
        return { openTime: (i + 1) * 3600000, closeTime: (i + 2) * 3600000 - 1, open: c - 0.5, high: c + 1, low: c - 1, close: c, volume: 1 };
    });
    const sym = {
        tickerid: 'TEST:X',
        ticker: 'X',
        root: 'X',
        prefix: 'TEST',
        type: 'crypto' as const,
        currency: 'USD',
        timezone: 'UTC',
        mintick: 0.01,
        pointvalue: 1,
        mincontract: 1,
        minmove: 1,
        pricescale: 100,
        session: '24x7',
        description: 'X',
    };
    const provider = { configure() {}, getSymbolInfo: async () => sym, getMarketData: async () => bars };
    const src = `//@version=5
strategy("when", initial_capital = 100000, default_qty_type = strategy.fixed, default_qty_value = 1)
${body}`;
    return new PineTS(provider, 'TEST:X', '60', bars.length, undefined, bars[bars.length - 1].closeTime)
        .run(new Indicator(src))
        .then((ctx) => ctx.strategy!);
}

const pending = (s: any, id: string) => s.pending_orders.filter((o: any) => o.status === 'pending' && o.id === id);

describe('strategy.* when argument', () => {
    it('strategy.entry and strategy.close act only on the bar where when is true', async () => {
        const s = await run(`strategy.entry("L", strategy.long, when = bar_index == 2)
strategy.close("L", when = bar_index == 5)`);
        expect(s.closedtrades.length).toBe(1);
        expect(s.opentrades.length).toBe(0);
        expect(s.closedtrades[0].entry_bar_index).toBe(3);
        expect(s.closedtrades[0].exit_bar_index).toBe(6);
    });

    it('when = false places nothing', async () => {
        const s = await run(`strategy.entry("L", strategy.long, when = false)
strategy.order("O", strategy.short, when = false)`);
        expect(s.closedtrades.length).toBe(0);
        expect(s.opentrades.length).toBe(0);
    });

    it('when = na places nothing', async () => {
        const s = await run(`bool c = na
strategy.entry("L", strategy.long, when = c)`);
        expect(s.closedtrades.length + s.opentrades.length).toBe(0);
    });

    it('strategy.order honours when', async () => {
        const s = await run(`strategy.order("B", strategy.long, when = bar_index == 1)`);
        expect(s.opentrades.length).toBe(1);
        expect(s.opentrades[0].entry_bar_index).toBe(2);
    });

    it('strategy.exit is placed only when when is true', async () => {
        // Without the guard the limit is placed from bar 1 on and fills on bar 2.
        const s = await run(`if bar_index == 0
    strategy.entry("L", strategy.long)
strategy.exit("X", "L", limit = close, when = bar_index == 4)`);
        expect(s.closedtrades.length).toBe(1);
        expect(s.closedtrades[0].exit_bar_index).toBe(5);
    });

    it('strategy.close_all honours when', async () => {
        const s = await run(`if bar_index == 0
    strategy.entry("L", strategy.long)
strategy.close_all(when = bar_index == 3)`);
        expect(s.closedtrades.length).toBe(1);
        expect(s.closedtrades[0].exit_bar_index).toBe(4);
    });

    it('strategy.cancel and strategy.cancel_all cancel only when when is true', async () => {
        const entry = `if bar_index == 0
    strategy.entry("L", strategy.long, limit = 1)
`;
        expect(pending(await run(entry + `strategy.cancel("L", when = false)`), 'L').length).toBe(1);
        expect(pending(await run(entry + `strategy.cancel("L", when = bar_index == 3)`), 'L').length).toBe(0);
        expect(pending(await run(entry + `strategy.cancel_all(when = false)`), 'L').length).toBe(1);
        expect(pending(await run(entry + `strategy.cancel_all(when = bar_index == 3)`), 'L').length).toBe(0);
    });

    it('a false when keeps the order already placed under the same id', async () => {
        const s = await run(`if bar_index == 0
    strategy.entry("L", strategy.long, limit = 1)
strategy.entry("L", strategy.long, limit = 2, when = false)`);
        const o = pending(s, 'L');
        expect(o.length).toBe(1);
        expect(o[0].limit).toBe(1);
    });
});
