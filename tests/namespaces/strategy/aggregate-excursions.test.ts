// SPDX-License-Identifier: AGPL-3.0-only
// Synthetic path arithmetic, independently calculated in each fixture.
import { describe, expect, it } from 'vitest';
import { Context } from '../../../src/Context.class';
import { Series } from '../../../src/Series';
import { initializeStrategy, processStrategyOrders, processExitOrders, finalizeStrategyBar, processOrdersOnClose, applyPendingCloseMarginCall, snapshotStrategyState, restoreStrategyState } from '../../../src/namespaces/strategy/utils';

function context(dir = 1, qty = 1, stop?: number, limit?: number) {
    const c: any = new Context({ marketData: [], source: [], tickerId: 'SYNTHETIC', timeframe: '5' } as any);
    c.pine = { syminfo: { pointvalue: 2, mincontract: 1, mintick: 0.25 } };
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
    applyPendingCloseMarginCall(c);
    processStrategyOrders(c);
    processExitOrders(c);
    finalizeStrategyBar(c);
}

describe('aggregate equity excursions replay actual fills chronologically', () => {
    it('retains favorable movement before a same-bar stop without counting the later low', () => {
        const c = context(1, 3, 90);
        bar(c, 0, [100, 105, 80, 100]);
        // H: (105-100)*3*2=30; stop: (100-90)*3*2=60; low80 is after exit.
        expect(c.strategy.max_runup).toBe(30);
        expect(c.strategy.max_drawdown).toBe(60);
        expect(c.strategy.max_drawdown_percent_value).toBeCloseTo(0.06, 10);
        expect(c.strategy.equity_at_runup_peak).toBe(100030);
    });
    it.each([1, -1])('retains adverse movement before a target, direction %s', (dir) => {
        const c = context(dir, 1, undefined, 100 + dir * 10);
        bar(c, 0, dir === 1 ? [100, 115, 98, 110] : [100, 102, 85, 90]);
        // Before target: adverse2*2=4; at target: favorable10*2=20.
        expect(c.strategy.max_drawdown).toBe(4);
        expect(c.strategy.max_runup).toBe(20);
    });
    it('replays an early market fill before a later stop despite queue order', () => {
        const c = context();
        Object.assign(c.strategy.pending_orders[0], { type: 'stop', stop: 110 });
        c.strategy.pending_orders.push({ id: 'market', direction: 1, qty: 1, type: 'market', category: 'entry', bar: -1, time: -1, status: 'pending' });
        bar(c, 0, [100, 115, 95, 112]);
        // Low95 sees only market100: loss10. High115 sees both: gain30+10=40.
        expect(c.strategy.max_drawdown).toBe(10);
        expect(c.strategy.max_runup).toBe(40);
    });
    it('replays an older target before a later limit entry without mutating fills', () => {
        const c = context();
        bar(c, 0, [100, 100, 100, 100]);
        c.strategy.pending_orders.push({ id: 'later', direction: 1, qty: 1, type: 'limit', limit: 85, category: 'entry', bar: 0, time: 0, status: 'pending' });
        c.strategy.pending_orders.push({ id: 'target', direction: -1, qty: 1, type: 'limit', limit: 104, category: 'exit', from_entry: 'entry', bar: 0, time: 0, status: 'pending' });
        bar(c, 1, [100, 105, 80, 100]);
        // Old exit realizes8; new lot's low loses10 from realized peak8. Close gains30+8=38.
        expect(c.strategy.closedtrades[0].exit_price).toBe(104);
        expect(c.strategy.opentrades[0].entry_price).toBe(85);
        expect(c.strategy.max_drawdown).toBe(10);
        expect(c.strategy.max_runup).toBe(38);
    });
    it('revalues the remaining quantity after a partial target', () => {
        const c = context(1, 2, undefined, 110);
        c.strategy.pending_orders[1].qty = 1;
        bar(c, 0, [100, 120, 95, 115]);
        // Low:2*(-5)*2=-20. After target realizes20, H adds remaining1*20*2=40.
        expect(c.strategy.max_drawdown).toBe(20);
        expect(c.strategy.max_runup).toBe(60);
        expect(c.strategy.max_runup_percent_value).toBeCloseTo(100 * 60 / 100060, 10);
    });
    it('visits reversal close and open at the same quote in execution order', () => {
        const c = context();
        bar(c, 0, [100, 100, 100, 100]);
        c.strategy.pending_orders.push({ id: 'reverse', direction: -1, qty: 2, type: 'market', category: 'entry', bar: 0, time: 0, status: 'pending' });
        bar(c, 1, [103, 104, 90, 95]);
        // Realized long profit6; short loses2 atH, gains26 atL: total gain32.
        expect(c.strategy.max_drawdown).toBe(2);
        expect(c.strategy.max_runup).toBe(32);
        expect(c.strategy.equity_peak).toBe(100006);
    });
    it('includes both commissions and actual execution slippage without moving surviving quotes', () => {
        const c = context(1, 1, 90);
        c.strategy.config.slippage = 1;
        c.strategy.config.commission_type = 'cash_per_contract';
        c.strategy.config.commission_value = 0.75;
        bar(c, 0, [100, 105, 80, 100]);
        // Entry100.25/exit89.75:21 price loss+1.5 fees=22.5. Runup uses commission-net trough99999.25.
        expect(c.strategy.max_drawdown).toBe(22.5);
        expect(c.strategy.max_runup).toBe(9.5);
        expect(c.strategy.closedtrades[0].max_runup).toBe(8.75);
    });
    it('starts an on-close entry after the preceding extrema', () => {
        const c = context();
        c.strategy.config.process_orders_on_close = true;
        c.strategy.config.slippage = 1;
        c.strategy.config.commission_type = 'cash_per_contract';
        c.strategy.config.commission_value = 0.75;
        c.strategy.pending_orders[0].bar = 0;
        prices(c, 0, [100, 120, 80, 105]);
        finalizeStrategyBar(c);
        processOrdersOnClose(c);
        // Only the entry fee0.75 and slippage0.25*2 apply; no trade existed atL80.
        expect(c.strategy.max_drawdown).toBe(1.25);
        expect(c.strategy.max_runup).toBe(0);
    });
    it('includes an immediate close after visiting the full surviving path', () => {
        const c = context();
        bar(c, 0, [100, 110, 95, 105]);
        c.strategy.pending_orders.push({ id: 'close', direction: -1, qty: 1, type: 'market', category: 'exit', immediately: true, bar: 0, time: 0, status: 'pending' });
        processOrdersOnClose(c);
        expect(c.strategy.max_drawdown).toBe(10);
        expect(c.strategy.max_runup).toBe(20);
        expect(c.strategy.netprofit).toBe(10);
    });
    it('books deferred previous-close liquidation before the next opening gap', () => {
        const c = context(1, 2);
        bar(c, 0, [100, 105, 95, 100]);
        c.strategy._pending_close_mc = { qty: 1, price: 95, time: 0, dir: 1 };
        bar(c, 1, [200, 200, 200, 200]);
        // Only one remaining contract sees next open200, adding200 to realized-10.
        expect(c.strategy.max_drawdown).toBe(20);
        expect(c.strategy.max_runup).toBe(200);
        expect(c.strategy.closedtrades[0].exit_price).toBe(95);
    });
    it('replays from the opening snapshot without accumulating a discarded streaming tick', () => {
        const c = context();
        bar(c, 0, [100, 100, 100, 100]);
        const snapshot = snapshotStrategyState(c.strategy);
        bar(c, 1, [100, 120, 80, 100]);
        expect(c.strategy.max_drawdown).toBe(40);
        restoreStrategyState(c.strategy, snapshot);
        bar(c, 1, [100, 101, 99, 100]);
        expect(c.strategy.max_drawdown).toBe(2);
        expect(c.strategy.max_runup).toBe(2);
    });
});
