import { describe, expect, it } from 'vitest';
import { Context } from '../../../src/Context.class';
import { processExitOrders, initializeStrategy } from '../../../src/namespaces/strategy/utils';
import { close_all } from '../../../src/namespaces/strategy/methods/close_all';
import { Series } from '../../../src/Series';

/**
 * Regression for strategy.close_all() snapshot binding.
 *
 * TV binds close_all/close(id) to the position at CALL time. Two variants:
 *  1. Queue-when-flat → no-op (guard in close_all.ts, covered by the
 *     close_all_flat_book.pine oracle).
 *  2. Queue-with-position + a reversal entry queued the same bar: the
 *     reversal fills first on the next bar's open, implicitly closing the
 *     snapshotted trades. The close_all must then be CANCELLED instead of
 *     catching the freshly-opened reversal trade at its entry price for
 *     $0 PnL. Implemented via `_intended_trade_ids` captured at queue time
 *     and re-checked in processExitOrders.
 *
 * Ground truth: QA close_all xlsx (BTCUSDT 1D) — trade #13's $5,512.65
 * divergence came from exactly this pattern; with the snapshot fix every
 * metric matches TV to the cent.
 */

function makeContext() {
    const context: any = new Context({
        marketData: [],
        source: [],
        tickerId: 'BTCUSDC',
        timeframe: 'D',
    } as any);
    context.pine = { syminfo: { mintick: 0.01, pointvalue: 1 } } as any;
    initializeStrategy(context, {});
    return context;
}

function setBar(context: any, idx: number, price: number) {
    context.idx = idx;
    context.data.open = new Series([price]);
    context.data.high = new Series([price * 1.01]);
    context.data.low = new Series([price * 0.99]);
    context.data.close = new Series([price]);
    context.data.openTime = new Series([idx * 1000]);
}

function makeTrade(id: string, entryId: string, size: number, entryPrice: number, barIdx: number) {
    return {
        id,
        entry_id: entryId,
        entry_comment: entryId,
        entry_price: entryPrice,
        entry_bar_index: barIdx,
        entry_time: barIdx * 1000,
        size,
        commission: 0,
        max_drawdown: 0,
        max_runup: 0,
        status: 'open',
    };
}

describe('strategy.close_all — snapshot binding to call-time position', () => {
    it('cancels when a reversal already closed the snapshotted trades (no $0 phantom close)', () => {
        const context = makeContext();
        const s = context.strategy;

        // Bar 0: long open; close_all queued (snapshots trade_1).
        setBar(context, 0, 50000);
        s.opentrades = [makeTrade('trade_1', 'MacdLE', 5, 50000, 0)];
        s.position_size = 5;
        s.position_avg_price = 50000;
        close_all(context)();

        expect(s.pending_orders.length).toBe(1);
        expect(s.pending_orders[0]._intended_trade_ids).toEqual(['trade_1']);

        // Bar 1: simulate the reversal having filled at the open BEFORE the
        // close_all is processed — trade_1 closed, trade_2 (short) opened.
        s.closedtrades = [{ ...s.opentrades[0], status: 'closed', exit_price: 60000, exit_time: 1000, profit: 50000 }];
        s.opentrades = [makeTrade('trade_2', 'MacdSE', -5, 60000, 1)];
        s.position_size = -5;
        s.position_avg_price = 60000;
        setBar(context, 1, 60000);

        processExitOrders(context);

        // The close_all found none of its snapshotted trades → cancelled.
        expect(s.pending_orders.length).toBe(0);
        expect(s.opentrades.length).toBe(1);          // trade_2 untouched
        expect(s.opentrades[0].id).toBe('trade_2');
        expect(s.closedtrades.length).toBe(1);         // no extra $0 close
        expect(s.position_size).toBe(-5);
    });

    it('fills normally when the snapshotted trades are still open', () => {
        const context = makeContext();
        const s = context.strategy;

        setBar(context, 0, 50000);
        s.opentrades = [makeTrade('trade_1', 'MacdLE', 5, 50000, 0)];
        s.position_size = 5;
        s.position_avg_price = 50000;
        close_all(context)();

        setBar(context, 1, 55000);
        processExitOrders(context);

        expect(s.closedtrades.length).toBe(1);
        expect(s.closedtrades[0].exit_price).toBe(55000); // next bar's open
        expect(s.opentrades.length).toBe(0);
        expect(s.position_size).toBe(0);
        expect(s.pending_orders.length).toBe(0);
    });

    it('is a no-op when called on a flat book', () => {
        const context = makeContext();
        const s = context.strategy;
        setBar(context, 0, 50000);
        // No open trades.
        close_all(context)();
        expect(s.pending_orders.length).toBe(0);
    });
});
