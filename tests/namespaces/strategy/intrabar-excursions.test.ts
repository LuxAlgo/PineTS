import { describe, expect, it } from 'vitest';
import { Context } from '../../../src/Context.class';
import { Series } from '../../../src/Series';
import { initializeStrategy, processStrategyOrders, processExitOrders, finalizeStrategyBar } from '../../../src/namespaces/strategy/utils';

function makeContext(dir: number, qty: number, stop?: number, limit?: number) {
    const c: any = new Context({ marketData: [], source: [], tickerId: 'MNQ', timeframe: '5' } as any);
    c.pine = { syminfo: { pointvalue: 2, mintick: 0.25, mincontract: 1 } } as any;
    initializeStrategy(c, { initial_capital: 100000, margin_long: 1, margin_short: 1 });
    c.strategy.pending_orders = [
        { id: 'entry', direction: dir, qty, type: 'market', category: 'entry', bar: -1, time: -1, status: 'pending' },
        { id: 'exit', direction: -dir, qty, type: 'stop', category: 'exit', from_entry: 'entry', stop, limit, bar: -1, time: -1, status: 'pending' },
    ];
    return c;
}
function bar(c: any, idx: number, prices: number[]) {
    c.idx = idx;
    ['open', 'high', 'low', 'close'].forEach((key, i) => c.data[key] = new Series([prices[i]]));
    c.data.openTime = new Series([idx * 300000]);
    processStrategyOrders(c);
    processExitOrders(c);
    finalizeStrategyBar(c);
}

// Expected excursions are from native TradingView MNQ 5m trades, captured
// 2026-09-14. No strategy source is required to reproduce these fills.
// Path rule: https://www.tradingview.com/support/solutions/43000681690/
describe('excursions over the executed part of each bar', () => {
    it('keeps the favorable move before a same-bar long stop', () => {
        const c = makeContext(1, 3, 30534.25);
        bar(c, 0, [30602.75, 30611, 30526.75, 30605]);
        const t = c.strategy.closedtrades[0];
        expect(t.exit_price).toBe(30534.25);
        expect(t.max_drawdown).toBe(411);
        expect(t.max_runup).toBe(49.5);
        expect(c.strategy.max_drawdown).toBe(411);
        expect(c.strategy.max_runup).toBe(49.5);
    });
    it('excludes the high reached after a short stop and retains earlier run-up', () => {
        const c = makeContext(-1, 2, 29897.75);
        [
            [29773.75, 29830.5, 29758, 29785.75],
            [29785.5, 29858.75, 29762, 29852],
            [29852.25, 29871, 29800.25, 29870.75],
            [29870.5, 29941.5, 29867.25, 29940],
        ].forEach((prices, i) => bar(c, i, prices));
        const t = c.strategy.closedtrades[0];
        expect(t.profit).toBe(-496);
        expect(t.max_drawdown).toBe(496);
        expect(t.max_runup).toBe(63);
        expect(c.strategy.max_drawdown).toBe(496);
        expect(c.strategy.max_runup).toBe(63);
    });
    it('visits the low first when the open is equidistant from both extremes', () => {
        const c = makeContext(-1, 4, undefined, 29245.5);
        bar(c, 0, [29261.75, 29280, 29243.5, 29259]);
        expect(c.strategy.closedtrades[0].max_drawdown).toBe(0);
        expect(c.strategy.closedtrades[0].max_runup).toBe(130);
    });
    it('does not count the pre-slippage trigger as movement after a stop entry', () => {
        const c = makeContext(-1, 1, undefined, 97.75);
        c.strategy.config.slippage = 1;
        c.strategy.config.commission_type = 'cash_per_contract';
        c.strategy.config.commission_value = 0.75;
        Object.assign(c.strategy.pending_orders[0], { type: 'stop', stop: 99.75 });
        bar(c, 0, [100, 101, 98, 98.5]);
        bar(c, 1, [98, 98.5, 97, 97.5]);
        const t = c.strategy.closedtrades[0];
        expect(t.entry_price).toBe(99.5);
        expect(t.max_drawdown).toBe(0);
        expect(t.max_runup).toBe(2.75);
    });
    it('includes stop-exit slippage in the trade adverse excursion', () => {
        const c = makeContext(1, 1, 98);
        c.strategy.config.slippage = 1;
        c.strategy.config.commission_type = 'cash_per_contract';
        c.strategy.config.commission_value = 0.75;
        bar(c, 0, [100, 101, 97, 100]);
        const t = c.strategy.closedtrades[0];
        expect(t.entry_price).toBe(100.25);
        expect(t.exit_price).toBe(97.75);
        expect(t.max_drawdown).toBe(5.75);
    });
    // Hand-calculated paths, symmetric for long and short.
    it.each([1, -1])('retains adverse movement before a winning target, direction %s', (dir) => {
        const c = makeContext(dir, 1, undefined, 100 + dir * 10);
        bar(c, 0, dir === 1 ? [100, 115, 98, 110] : [100, 102, 85, 90]);
        expect(c.strategy.closedtrades[0].max_drawdown).toBe(4);
        expect(c.strategy.closedtrades[0].max_runup).toBe(20);
    });
    it('does not include the exit bar extremes for a market close at the open', () => {
        const c = makeContext(1, 1);
        c.strategy.pending_orders.pop();
        bar(c, 0, [100, 101, 99, 100]);
        c.strategy.pending_orders.push({ id: 'close', direction: -1, qty: 1, type: 'market', category: 'exit', bar: 0, time: 0, status: 'pending' });
        bar(c, 1, [102, 150, 50, 110]);
        expect(c.strategy.closedtrades[0].max_drawdown).toBe(2);
        expect(c.strategy.closedtrades[0].max_runup).toBe(4);
    });
});
