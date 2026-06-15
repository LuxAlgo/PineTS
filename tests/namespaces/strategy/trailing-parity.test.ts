import { describe, expect, it } from 'vitest';
import { Context } from '../../../src/Context.class';
import { Series } from '../../../src/Series';
import { StrategyState } from '../../../src/namespaces/strategy/types';
import { processExitOrders } from '../../../src/namespaces/strategy/utils';

function createTrailingContext({
    open,
    high,
    low,
    close,
}: {
    open: number;
    high: number;
    low: number;
    close: number;
}) {
    const context = new Context({
        marketData: [],
        source: [],
        tickerId: 'BTCUSDC',
        timeframe: 'D',
    });
    context.idx = 1;

    context.data.open = new Series([100, open]);
    context.data.high = new Series([110, high]);
    context.data.low = new Series([99, low]);
    context.data.close = new Series([110, close]);
    context.data.openTime = new Series([0, 1000]);

    const strategy: StrategyState = {
        config: {
            title: 'Test Strategy',
            overlay: true,
        },
        opentrades: [
            {
                id: 'trade_1',
                entry_id: 'buy',
                entry_price: 100,
                entry_bar_index: 0,
                entry_time: 0,
                size: 1,
                status: 'open',
            },
        ],
        closedtrades: [],
        pending_orders: [
            {
                id: 'exit_1',
                direction: -1,
                qty: 1,
                type: 'stop',
                category: 'exit',
                from_entry: 'buy',
                trail_points: 10,
                trail_offset: 5,
                trail_peak: 110,
                trail_armed: true,
                status: 'pending',
                bar: 0,
                time: 0,
            },
        ],
        position_size: 1,
        position_avg_price: 100,
        position_entry_name: 'buy',
        initial_capital: 10000,
        account_currency: 'USD',
        equity: 10000,
        netprofit: 0,
        grossprofit: 0,
        grossloss: 0,
        openprofit: 0,
        max_drawdown: 0,
        max_runup: 0,
        equity_peak: 10000,
        equity_trough: 10000,
        equity_at_runup_peak: 10000,
        equity_at_drawdown_peak: 10000,
        max_drawdown_percent_value: 0,
        max_runup_percent_value: 0,
        wintrades: 0,
        losstrades: 0,
        eventrades: 0,
        wintrades_total_profit: 0,
        losstrades_total_loss: 0,
        max_contracts_held_all: 1,
        max_contracts_held_long: 1,
        max_contracts_held_short: 0,
        risk_rules: {},
        risk_halted: false,
    };

    context.strategy = strategy;
    context.pine = {
        syminfo: {
            mintick: 1,
        },
    } as any;

    return {
        context,
        order: strategy.pending_orders[0],
        strategy,
    };
}

describe('Strategy - Trailing Stop Price Path Parity', () => {
    it('keeps an adverse-first long trail pending when segment 1 misses the old trigger and segment 3 misses the new trigger', () => {
        const { context, order, strategy } = createTrailingContext({
            open: 108,
            high: 120,
            low: 106,
            close: 118,
        });

        processExitOrders(context);

        expect(order.status).toBe('pending');
        expect(order.trail_peak).toBe(120);
        expect(strategy.closedtrades).toHaveLength(0);
    });

    it('fills an adverse-first long trail at the updated trigger when segment 3 crosses it', () => {
        const { context, order, strategy } = createTrailingContext({
            open: 108,
            high: 120,
            low: 106,
            close: 110,
        });

        processExitOrders(context);

        expect(order.status).toBe('filled');
        expect(order.fill_price).toBe(115);
        expect(order.trail_peak).toBe(120);
        expect(strategy.closedtrades).toHaveLength(1);
        expect(strategy.closedtrades[0].exit_price).toBe(115);
    });

    it('keeps the favorable-first long trail behavior by updating the peak before the trigger check', () => {
        const { context, order, strategy } = createTrailingContext({
            open: 118,
            high: 120,
            low: 106,
            close: 110,
        });

        processExitOrders(context);

        expect(order.status).toBe('filled');
        expect(order.fill_price).toBe(115);
        expect(order.trail_peak).toBe(120);
        expect(strategy.closedtrades).toHaveLength(1);
        expect(strategy.closedtrades[0].exit_price).toBe(115);
    });
});
