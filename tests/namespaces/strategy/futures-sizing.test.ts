import { describe, expect, it } from 'vitest';
import { Context } from '../../../src/Context.class';
import { Series } from '../../../src/Series';
import { entry } from '../../../src/namespaces/strategy/methods/entry';
import { calculateOrderQty, initializeStrategy, processStrategyOrders } from '../../../src/namespaces/strategy/utils';

function contextFor(config: any = {}, symbol: any = {}) {
    const c: any = new Context({ marketData: [], source: [], tickerId: 'MNQ', timeframe: '5' } as any);
    c.pine = { syminfo: { pointvalue: 2, mincontract: 1, mintick: 0.25, ...symbol } } as any;
    initializeStrategy(c, { initial_capital: 1000000, default_qty_type: 'percent_of_equity', default_qty_value: 100, ...config });
    c.idx = 0;
    for (const field of ['open', 'high', 'low', 'close']) c.data[field] = new Series([30573.25]);
    c.data.openTime = new Series([0]);
    return c;
}

describe('contract-aware strategy sizing', () => {
    // Native MNQ comparison: $1m / (30573.25 * $2/point), rounded down = 16 contracts.
    it.each(['cash', 'percent_of_equity'])('uses pointvalue and minimum contracts for %s', (type) => {
        const c = contextFor({ default_qty_type: type, default_qty_value: type === 'cash' ? 1000000 : 100 });
        expect(calculateOrderQty(c, undefined, 1, 30573.25)).toBe(16);
    });
    it('admits the affordable futures order through the margin check', () => {
        const c = contextFor();
        entry(c)('Long', 1);
        c.idx = 1;
        processStrategyOrders(c);
        expect(c.strategy.position_size).toBe(16);
    });
    it('does not create a trade when the allocation is smaller than one contract', () => {
        const c = contextFor({ initial_capital: 100000, default_qty_value: 10 });
        entry(c)('Long', 1);
        c.idx = 1;
        processStrategyOrders(c);
        expect(c.strategy.opentrades).toHaveLength(0);
        expect(c.strategy.position_size).toBe(0);
    });
    it('retains supported fractional contracts', () => {
        const c = contextFor({ default_qty_type: 'cash', default_qty_value: 125 }, { pointvalue: 1, mincontract: 0.001 });
        expect(calculateOrderQty(c, undefined, 1, 30000)).toBe(0.004);
    });
    it('preserves zero allocation', () => {
        expect(calculateOrderQty(contextFor({ default_qty_value: 0 }), undefined, 1, 100)).toBe(0);
    });
});
