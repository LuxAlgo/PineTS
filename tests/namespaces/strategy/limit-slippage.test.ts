import { describe, expect, it } from 'vitest';
import { Context } from '../../../src/Context.class';
import { Series } from '../../../src/Series';
import { initializeStrategy, openTrade, processExitOrders, processStrategyOrders } from '../../../src/namespaces/strategy/utils';

function makeContext(dir: number, kind: 'profit' | 'loss', gap: boolean) {
    const c: any = new Context({ marketData: [], source: [], tickerId: 'MNQ', timeframe: '5' } as any);
    c.pine = { syminfo: { pointvalue: 2, mintick: 0.25, mincontract: 1 } } as any;
    initializeStrategy(c, { initial_capital: 100000, slippage: 1 });
    c.idx = 0;
    for (const field of ['open', 'high', 'low', 'close']) c.data[field] = new Series([100]);
    c.data.openTime = new Series([0]);
    openTrade(c, 'entry', dir, 1, 100, 0);
    c.idx = 1;
    c.data.open = new Series([gap ? 100 + dir * 3 : 100]);
    c.data.high = new Series([104]);
    c.data.low = new Series([96]);
    c.strategy.pending_orders.push({ id: 'exit', from_entry: 'entry', direction: -dir, qty: 1,
        type: kind === 'profit' ? 'limit' : 'stop', category: 'exit', [kind]: 8, bar: 0, time: 0, status: 'pending' });
    return c;
}

describe('slippage by order type', () => {
    it.each([1, -1])('does not slip a profit limit, direction %s', (dir) => {
        const c = makeContext(dir, 'profit', false);
        processExitOrders(c);
        expect(c.strategy.closedtrades[0].exit_price).toBe(100 + dir * 2);
    });
    it.each([1, -1])('preserves the better opening fill of a gapped limit, direction %s', (dir) => {
        const c = makeContext(dir, 'profit', true);
        processExitOrders(c);
        expect(c.strategy.closedtrades[0].exit_price).toBe(100 + dir * 3);
    });
    it.each([1, -1])('still slips stop exits, direction %s', (dir) => {
        const c = makeContext(dir, 'loss', false);
        processExitOrders(c);
        expect(c.strategy.closedtrades[0].exit_price).toBe(100 - dir * 2.25);
    });
    it.each([1, -1])('does not slip limit entries, direction %s', (dir) => {
        const c = makeContext(dir, 'profit', false);
        c.strategy.opentrades = [];
        c.strategy.position_size = 0;
        c.strategy.pending_orders = [{ id: 'limit', direction: dir, qty: 1, type: 'limit', limit: 100 - dir,
            category: 'entry', bar: 0, time: 0, status: 'pending' }];
        processStrategyOrders(c);
        expect(c.strategy.opentrades[0].entry_price).toBe(100 - dir);
    });
});
