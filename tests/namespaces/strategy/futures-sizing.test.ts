// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest';
import { Context } from '../../../src/Context.class';
import { Series } from '../../../src/Series';
import { entry } from '../../../src/namespaces/strategy/methods/entry';
import { order } from '../../../src/namespaces/strategy/methods/order';
import { default_entry_qty } from '../../../src/namespaces/strategy/methods/default_entry_qty';
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
    // Independent notional arithmetic: floor($1m / (30573.25 * $2/point)) = 16.
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
    it.each(['fixed', 'cash', 'percent_of_equity'])('preserves literal zero for %s', (type) => {
        expect(calculateOrderQty(contextFor({ default_qty_type: type, default_qty_value: 0 }), undefined, -1, 100)).toBe(0);
    });
    it('retains fixed and explicit quantities without dividing by point value', () => {
        const c = contextFor({ default_qty_type: 'fixed', default_qty_value: 3.9 });
        expect(calculateOrderQty(c, undefined, 1, 100)).toBe(3);
        expect(calculateOrderQty(c, -5.9, -1, 100)).toBe(5);
        expect(calculateOrderQty(c, NaN, 1, 100)).toBe(3);
    });
    it('keeps fractional contracts with a non-unit point value', () => {
        const c = contextFor({ default_qty_type: 'cash', default_qty_value: 125 }, { pointvalue: 2, mincontract: 0.25 });
        expect(calculateOrderQty(c, undefined, -1, 100)).toBe(0.5);
    });
    it('uses unit point value and the existing precision fallback when metadata is absent', () => {
        const c = contextFor({ default_qty_type: 'cash', default_qty_value: 125 }, { pointvalue: undefined, mincontract: undefined });
        expect(calculateOrderQty(c, undefined, 1, 30000)).toBe(0.004166);
    });
    it('uses callable allocation options and current equity', () => {
        const c = contextFor({ default_qty_type: () => 'percent_of_equity', default_qty_value: () => 50 });
        c.strategy.equity = 80000;
        expect(calculateOrderQty(c, undefined, 1, 10000)).toBe(2);
    });
    it.each([entry, order])('sizes at order price before slippage changes the fill', (place) => {
        const c = contextFor({ default_qty_type: 'cash', default_qty_value: 1000, slippage: 4, margin_long: 0 });
        for (const field of ['open', 'high', 'low', 'close']) c.data[field] = new Series([100]);
        place(c)('Long', 1, { stop: 125 });
        expect(c.strategy.pending_orders[0].qty).toBe(4);
        c.idx = 1;
        for (const field of ['open', 'high', 'low', 'close']) c.data[field] = new Series([130]);
        processStrategyOrders(c);
        expect(c.strategy.opentrades[0].entry_price).toBe(126);
        expect(c.strategy.position_size).toBe(4);
    });
    it('exposes contract-aware sizing through default_entry_qty', () => {
        const c = contextFor({ default_qty_type: 'cash', default_qty_value: 1000 });
        expect(default_entry_qty(c)(125)).toBe(4);
    });
});
