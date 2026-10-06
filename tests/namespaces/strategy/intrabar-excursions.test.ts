// SPDX-License-Identifier: AGPL-3.0-only
// Synthetic bars, hand-calculated from the documented broker-emulator OHLC path.
// These are arithmetic regression cases, not a fresh TradingView capture.
import { describe, expect, it } from 'vitest';
import { Context } from '../../../src/Context.class';
import { Series } from '../../../src/Series';
import { initializeStrategy, processStrategyOrders, processExitOrders, finalizeStrategyBar, processOrdersOnClose, processMarginCall } from '../../../src/namespaces/strategy/utils';

function context(dir = 1, qty = 1, stop?: number, limit?: number) {
    const c: any = new Context({ marketData: [], source: [], tickerId: 'SYNTHETIC', timeframe: '5' } as any);
    c.pine = { syminfo: { pointvalue: 2, mintick: 0.25, mincontract: 1 } } as any;
    initializeStrategy(c, { initial_capital: 100000, margin_long: 0, margin_short: 0 });
    c.strategy.pending_orders = [{ id: 'entry', direction: dir, qty, type: 'market', category: 'entry', bar: -1, time: -1, status: 'pending' }];
    if (stop !== undefined || limit !== undefined) c.strategy.pending_orders.push({ id: 'exit', direction: -dir, qty, type: 'stop', category: 'exit', from_entry: 'entry', stop, limit, bar: -1, time: -1, status: 'pending' });
    return c;
}
function prices(c: any, idx: number, values: number[]) {
    c.idx = idx;
    ['open', 'high', 'low', 'close'].forEach((key, i) => { c.data[key] = new Series([values[i]]); });
    c.data.openTime = new Series([idx * 300000]);
}
function bar(c: any, idx: number, values: number[]) {
    prices(c, idx, values);
    processStrategyOrders(c);
    processExitOrders(c);
    finalizeStrategyBar(c);
}

describe('excursions over the executed part of a bar', () => {
    it('retains run-up before a long stop and excludes prices after it', () => {
        const c = context(1, 3, 90);
        bar(c, 0, [100, 105, 80, 100]); // O-H-L-C; stop after the high
        expect(c.strategy.closedtrades[0]).toMatchObject({ exit_price: 90, max_drawdown: 60, max_runup: 30 });
        expect(c.strategy.max_drawdown).toBe(60);
    });
    it('retains short run-up before a stop and excludes the later high', () => {
        const c = context(-1, 2, 110);
        bar(c, 0, [100, 120, 95, 110]); // O-L-H-C
        expect(c.strategy.closedtrades[0]).toMatchObject({ exit_price: 110, max_drawdown: 40, max_runup: 20 });
    });
    it.each([1, -1])('retains adverse movement before a target, direction %s', (dir) => {
        const c = context(dir, 1, undefined, 100 + dir * 10);
        bar(c, 0, dir === 1 ? [100, 115, 98, 110] : [100, 102, 85, 90]);
        expect(c.strategy.closedtrades[0]).toMatchObject({ max_drawdown: 4, max_runup: 20 });
    });
    it('excludes the exit-bar extremes for a market close at the open', () => {
        const c = context();
        bar(c, 0, [100, 102, 99, 100]);
        c.strategy.pending_orders.push({ id: 'close', direction: -1, qty: 1, type: 'market', category: 'exit', bar: 0, time: 0, status: 'pending' });
        bar(c, 1, [103, 150, 50, 110]);
        expect(c.strategy.closedtrades[0]).toMatchObject({ max_drawdown: 2, max_runup: 6 });
    });
    it('includes stop-exit slippage, preserving earlier run-up', () => {
        const c = context(1, 1, 90);
        c.strategy.config.slippage = 1;
        c.strategy.config.commission_type = 'cash_per_contract';
        c.strategy.config.commission_value = 0.75;
        bar(c, 0, [100, 105, 80, 100]);
        expect(c.strategy.closedtrades[0]).toMatchObject({ entry_price: 100.25, exit_price: 89.75, max_drawdown: 21.75, max_runup: 8.75 });
    });
    it('excludes quotes before an intrabar stop entry', () => {
        const c = context();
        Object.assign(c.strategy.pending_orders[0], { type: 'stop', stop: 110 });
        bar(c, 0, [100, 115, 95, 112]); // entry on low-to-high leg
        expect(c.strategy.opentrades[0]).toMatchObject({ entry_price: 110, max_drawdown: 0, max_runup: 10 });
    });
    it('accounts for the whole path before an immediate close', () => {
        const c = context();
        bar(c, 0, [100, 110, 95, 105]);
        c.strategy.pending_orders.push({ id: 'close', direction: -1, qty: 1, type: 'market', category: 'exit', immediately: true, bar: 0, time: 0, status: 'pending' });
        processOrdersOnClose(c);
        expect(c.strategy.closedtrades[0]).toMatchObject({ exit_price: 105, max_drawdown: 10, max_runup: 20 });
    });
    it('starts an on-close entry at the close rather than preceding extremes', () => {
        const c = context();
        c.strategy.config.process_orders_on_close = true;
        c.strategy.pending_orders[0].bar = 0;
        prices(c, 0, [100, 120, 80, 105]);
        finalizeStrategyBar(c);
        processOrdersOnClose(c);
        expect(c.strategy.opentrades[0]).toMatchObject({ entry_price: 105, max_drawdown: 0, max_runup: 0 });
        bar(c, 1, [106, 108, 104, 107]);
        expect(c.strategy.opentrades[0]).toMatchObject({ max_drawdown: 2, max_runup: 6 });
    });
    it('does not replay the first path segment after a partial target', () => {
        const c = context(1, 2, undefined, 110);
        c.strategy.pending_orders[1].qty = 1;
        bar(c, 0, [100, 120, 95, 115]);
        expect(c.strategy.closedtrades[0]).toMatchObject({ size: 1, max_drawdown: 10, max_runup: 20 });
        expect(c.strategy.opentrades[0]).toMatchObject({ size: 1, max_drawdown: 10, max_runup: 40 });
    });
    it('keeps excursions before a reversal separate from the new position', () => {
        const c = context();
        bar(c, 0, [100, 102, 99, 100]);
        c.strategy.pending_orders.push({ id: 'reverse', direction: -1, qty: 2, type: 'market', category: 'entry', bar: 0, time: 0, status: 'pending' });
        bar(c, 1, [103, 104, 90, 95]);
        expect(c.strategy.closedtrades[0]).toMatchObject({ max_drawdown: 2, max_runup: 6 });
        expect(c.strategy.opentrades[0]).toMatchObject({ size: -1, entry_price: 103, max_drawdown: 2, max_runup: 26 });
    });
    it('records a gap stop at the open without exposing the closed lot to later extremes', () => {
        const c = context(1, 1, 95);
        bar(c, 0, [100, 102, 99, 100]);
        bar(c, 1, [90, 150, 50, 100]);
        expect(c.strategy.closedtrades[0]).toMatchObject({ exit_price: 90, max_drawdown: 20, max_runup: 4 });
    });
    it('records the retracement after the favorable extreme for a trailing stop', () => {
        const c = context();
        c.strategy.pending_orders.push({ id: 'trail', direction: -1, qty: 1, type: 'stop', category: 'exit', from_entry: 'entry', trail_price: 101, trail_offset: 4, bar: -1, time: -1, status: 'pending' });
        bar(c, 0, [100, 105, 90, 100]);
        expect(c.strategy.closedtrades[0]).toMatchObject({ exit_price: 104, max_drawdown: 0, max_runup: 10 });
    });
    it('advances to the margin checkpoint before a partial liquidation', () => {
        const c = context(1, 10);
        c.strategy.initial_capital = c.strategy.equity = c.strategy.equity_peak = c.strategy.equity_trough = 1100;
        c.strategy.config.margin_long = 50;
        prices(c, 0, [100, 105, 80, 90]);
        processStrategyOrders(c);
        processMarginCall(c, 'extreme');
        finalizeStrategyBar(c);
        expect(c.strategy.closedtrades[0]).toMatchObject({ exit_id: 'Margin call', exit_price: 80, size: 5, max_drawdown: 200, max_runup: 50 });
        expect(c.strategy.opentrades[0]).toMatchObject({ size: 5, max_drawdown: 200, max_runup: 50 });
    });
    it('keeps an earlier market entry interval when a later stop is queued first', () => {
        const c = context();
        Object.assign(c.strategy.pending_orders[0], { type: 'stop', stop: 110 });
        c.strategy.pending_orders.push({ id: 'market', direction: 1, qty: 1, type: 'market', category: 'entry', bar: -1, time: -1, status: 'pending' });
        bar(c, 0, [100, 115, 95, 112]);
        expect(c.strategy.opentrades.find((t: any) => t.entry_id === 'market')).toMatchObject({ entry_price: 100, max_drawdown: 10, max_runup: 30 });
    });
    it('excludes a later entry quote from an older lot that exits earlier on the path', () => {
        const c = context();
        bar(c, 0, [100, 100, 100, 100]);
        c.strategy.pending_orders.push({ id: 'later', direction: 1, qty: 1, type: 'limit', limit: 85, category: 'entry', bar: 0, time: 0, status: 'pending' });
        c.strategy.pending_orders.push({ id: 'target', direction: -1, qty: 1, type: 'limit', limit: 104, category: 'exit', from_entry: 'entry', bar: 0, time: 0, status: 'pending' });
        bar(c, 1, [100, 105, 80, 100]);
        expect(c.strategy.closedtrades[0]).toMatchObject({ exit_price: 104, max_drawdown: 0, max_runup: 8 });
    });
    it('preserves stop-limit execution without applying stop slippage', () => {
        const c = context();
        c.strategy.config.slippage = 4;
        Object.assign(c.strategy.pending_orders[0], { type: 'stop-limit', stop: 110, limit: 111 });
        bar(c, 0, [100, 115, 95, 112]);
        expect(c.strategy.opentrades[0]).toMatchObject({ entry_price: 110, max_drawdown: 0, max_runup: 10 });
    });
});
