import { describe, expect, it } from 'vitest';
import { Context } from '../../../src/Context.class';
import { initializeStrategy, processStrategyOrders } from '../../../src/namespaces/strategy/utils';
import { entry } from '../../../src/namespaces/strategy/methods/entry';
import { Series } from '../../../src/Series';

/**
 * Simultaneous opposite-direction entries while pyramided — reversal sizing.
 *
 * Bug (QA "Sim Pyramiding", TV-verified): with `pyramiding=3` and a short
 * position of -3, three long `strategy.entry` calls queued on the SAME bar
 * each read the stale pre-fill `position_size` (-3) and are each classified as
 * a reversal — so each gets `qty = |−3| + 1 = 4` and bypasses the pyramiding
 * cap. PineTS ended at position +9; TradingView ends at +3 (only the FIRST
 * opposite entry reverses: close 3 shorts + open 1; the rest are plain
 * pyramiding adds of qty 1).
 *
 * The fix projects the position across same-bar already-queued MARKET entries
 * (Δpos = direction × order.qty, exact even for reversal orders), so only the
 * first opposite entry is a reversal. This is asserted at QUEUE level (the
 * exact fix point) plus a full fill cycle, with guards that normal pyramiding
 * and a single reversal (margin-call overshoot machinery) are unaffected.
 */

function makeContext(config: any = {}) {
    const context: any = new Context({
        marketData: [],
        source: [],
        tickerId: 'BTCUSDT',
        timeframe: 'D',
    } as any);
    context.idx = 0;
    context.data.open = new Series([100]);
    context.data.high = new Series([101]);
    context.data.low = new Series([99]);
    context.data.close = new Series([100]);
    context.data.openTime = new Series([0]);
    context.pine = { syminfo: { mintick: 0.01, pointvalue: 1 } } as any;
    initializeStrategy(context, { pyramiding: 3, ...config });
    return context;
}

function openShorts(context: any, n: number, entryPrice: number) {
    for (let i = 0; i < n; i++) {
        context.strategy.opentrades.push({
            id: `s${i}`, entry_id: `Short ${i + 1}`, entry_price: entryPrice,
            entry_bar_index: 0, entry_time: 0, size: -1, commission: 0,
            max_drawdown: 0, max_runup: 0, status: 'open',
        });
    }
    context.strategy.position_size = -n;
    context.strategy.position_avg_price = entryPrice;
}

describe('pyramiding reversal — simultaneous opposite entries (must pass after fix)', () => {
    it('only the FIRST opposite entry reverses; the rest are pyramiding adds (not over-sized)', () => {
        const context = makeContext();
        openShorts(context, 3, 110); // position -3
        const e = entry(context);
        e('Long 1', 'long');
        e('Long 2', 'long');
        e('Long 3', 'long');

        const o = context.strategy.pending_orders;
        expect(o.length).toBe(3);
        // Long 1 reverses: close 3 shorts + open 1 = qty 4
        expect(o[0].qty).toBe(4);
        expect(o[0]._isReversalEntry).toBe(true);
        // Long 2 & 3 are pyramiding adds against the projected long position
        expect(o[1].qty).toBe(1);
        expect(o[1]._isReversalEntry).toBe(false);
        expect(o[2].qty).toBe(1);
        expect(o[2]._isReversalEntry).toBe(false);
    });

    it('fills to position +3 (TV), not +9', () => {
        const context = makeContext();
        openShorts(context, 3, 110);
        const e = entry(context);
        e('Long 1', 'long');
        e('Long 2', 'long');
        e('Long 3', 'long');

        // advance to the fill bar (market orders fill next bar)
        context.idx = 1;
        context.data.open = new Series([100, 100]);
        context.data.high = new Series([101, 101]);
        context.data.low = new Series([99, 99]);
        context.data.close = new Series([100, 100]);
        context.data.openTime = new Series([0, 86_400_000]);
        processStrategyOrders(context);

        expect(context.strategy.position_size).toBe(3);
        expect(context.strategy.opentrades.length).toBe(3);
        for (const t of context.strategy.opentrades) expect(t.size).toBe(1);
        expect(context.strategy.closedtrades.length).toBe(3); // the 3 shorts
    });
});

describe('pyramiding reversal — regression guards (green before AND after)', () => {
    it('three entries from FLAT are plain pyramiding adds (qty 1 each, no reversal)', () => {
        const context = makeContext();
        const e = entry(context);
        e('L1', 'long');
        e('L2', 'long');
        e('L3', 'long');
        const o = context.strategy.pending_orders;
        expect(o.map((x: any) => x.qty)).toEqual([1, 1, 1]);
        expect(o.every((x: any) => !x._isReversalEntry)).toBe(true);
    });

    it('a SINGLE reversal entry still closes+opens (qty = |pos| + base) — margin-call overshoot intact', () => {
        const context = makeContext();
        openShorts(context, 3, 110);
        const e = entry(context);
        e('Long 1', 'long');
        const o = context.strategy.pending_orders;
        expect(o.length).toBe(1);
        expect(o[0].qty).toBe(4);
        expect(o[0]._isReversalEntry).toBe(true);
        expect(o[0]._base_qty).toBe(1);
    });
});
