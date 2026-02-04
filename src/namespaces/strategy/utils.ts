// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

import { Order, StrategyState, Trade } from './types';
import { Series } from '../../Series';

/**
 * Parse strategy() function arguments
 */
export function parseStrategyOptions(args: any[]): any {
    if (args.length === 0) return {};

    // If first arg is a string, it's the title
    if (typeof args[0] === 'string') {
        const options: any = { title: args[0] };

        // If second arg is object, merge it
        if (args.length > 1 && typeof args[1] === 'object') {
            return { ...options, ...args[1] };
        }

        return options;
    }

    // If first arg is object, use it directly
    if (typeof args[0] === 'object') {
        return args[0];
    }

    return {};
}

/**
 * Calculate order quantity based on strategy configuration
 */
export function calculateOrderQty(context: any, specifiedQty: number | undefined, direction: number, fillPrice: number): number {
    const strategy: StrategyState = context.strategy;

    // Get qty type and value, calling functions if needed
    let qtyType = strategy.config.default_qty_type || 'fixed';
    let qtyValue = strategy.config.default_qty_value || 1;

    // If qtyType is a function, call it to get the actual string value
    if (typeof qtyType === 'function') {
        qtyType = (qtyType as Function)();
    }

    // If qtyValue is a function, call it to get the actual numeric value
    if (typeof qtyValue === 'function') {
        qtyValue = (qtyValue as Function)();
    }

    if (specifiedQty !== undefined && specifiedQty !== null) {
        return Math.abs(specifiedQty);
    }

    switch (qtyType) {
        case 'fixed':
            return qtyValue;

        case 'cash':
            // Calculate how many units we can buy with the cash amount
            return qtyValue / fillPrice;

        case 'percent_of_equity':
            // Calculate quantity based on percentage of equity
            // qty_value=10 means 10% of equity
            const positionValue = (strategy.equity * qtyValue) / 100;
            const equityQty = positionValue / fillPrice;
            return equityQty;

        default:
            return qtyValue;
    }
}

/**
 * Process pending orders and execute them
 */
export function processStrategyOrders(context: any): void {
    if (!context.strategy) return;

    const strategy: StrategyState = context.strategy;
    const { pendingOrders } = strategy;

    // Get current bar's OHLC data
    const openPrice = Series.from(context.data.open).get(0);
    const highPrice = Series.from(context.data.high).get(0);
    const lowPrice = Series.from(context.data.low).get(0);
    const closePrice = Series.from(context.data.close).get(0);
    const currentTime = Series.from(context.data.openTime).get(0);

    // Update unrealized P&L for open trades using OPEN price (for accurate equity at order execution time)
    updateUnrealizedPnL(context, openPrice);

    // Process each pending order that was placed on a previous bar
    for (const order of pendingOrders) {
        if (order.status !== 'pending') continue;

        // Orders placed on bar N can only fill on bar N+1 or later
        // Skip if this order was placed on the current bar (context.idx)
        if (order.bar >= context.idx) {
            continue;
        }

        let shouldFill = false;
        let fillPrice = openPrice;

        console.log(
            `[DEBUG ProcessOrders] Checking order ${order.id} (type=${order.type}) at bar ${context.idx}. Open=${openPrice}, High=${highPrice}, Low=${lowPrice}`
        );

        // Determine if order should be filled based on type
        switch (order.type) {
            case 'market':
                // Market orders fill at current bar's open (which is "next bar's open" from order placement)
                shouldFill = true;
                fillPrice = openPrice;
                break;

            case 'limit':
                // Limit orders fill when price reaches the limit level
                if (order.limitPrice !== undefined) {
                    const direction = parseDirection(order.direction);
                    if (direction === 1 && lowPrice <= order.limitPrice) {
                        // Long limit order - buy when price drops to limit
                        shouldFill = true;
                        fillPrice = order.limitPrice;
                    } else if (direction === -1 && highPrice >= order.limitPrice) {
                        // Short limit order - sell when price rises to limit
                        shouldFill = true;
                        fillPrice = order.limitPrice;
                    }
                }
                break;

            case 'stop':
                // Stop orders fill when price crosses the stop level
                if (order.stopPrice !== undefined) {
                    const direction = parseDirection(order.direction);
                    if (direction === 1 && highPrice >= order.stopPrice) {
                        // Long stop order - buy when price rises to stop
                        shouldFill = true;
                        fillPrice = order.stopPrice;
                    } else if (direction === -1 && lowPrice <= order.stopPrice) {
                        // Short stop order - sell when price falls to stop
                        shouldFill = true;
                        fillPrice = order.stopPrice;
                    }
                }
                break;
        }

        if (shouldFill) {
            // Execute the order using the pre-calculated qty
            executeOrder(context, order, fillPrice, currentTime);
            order.status = 'filled';
            order.fillPrice = fillPrice;
            order.fillBar = context.idx;
            order.fillTime = currentTime;
        }
    }

    // Remove filled and cancelled orders
    strategy.pendingOrders = pendingOrders.filter((o) => o.status === 'pending');

    // Update strategy metrics using CLOSE price (for script access)
    updateUnrealizedPnL(context, closePrice);
    updateStrategyMetrics(context);
}

/**
 * Parse direction string/number to numeric value
 */
export function parseDirection(direction: number | string): number {
    if (typeof direction === 'number') return direction;
    if (direction === 'long') return 1;
    if (direction === 'short') return -1;
    return 0;
}

/**
 * Open a new trade
 */
export function openTrade(context: any, entryId: string, direction: number, qty: number, price: number, time: number): void {
    const strategy: StrategyState = context.strategy;

    const trade: Trade = {
        id: `trade_${strategy.trades.length}`,
        entryId,
        direction,
        qty,
        entryPrice: price,
        entryBar: context.idx,
        entryTime: time,
        status: 'open',
    };

    strategy.trades.push(trade);
    strategy.openTrades.push(trade);

    // Update position
    const oldSize = strategy.position.size;
    const newSize = oldSize + direction * qty;

    if (oldSize === 0) {
        // Opening fresh position
        strategy.position = {
            size: newSize,
            avgPrice: price,
            direction,
            entryBar: context.idx,
        };
    } else if (Math.sign(oldSize) === Math.sign(newSize)) {
        // Adding to existing position - calculate new average price
        const totalCost = Math.abs(oldSize) * strategy.position.avgPrice + qty * price;
        const totalQty = Math.abs(newSize);
        strategy.position.avgPrice = totalCost / totalQty;
        strategy.position.size = newSize;
    }
}

/**
 * Execute an order
 * strategy.order() modifies the net position directly
 */
function executeOrder(context: any, order: Order, fillPrice: number, fillTime: number): void {
    const strategy: StrategyState = context.strategy;
    const direction = parseDirection(order.direction);
    const oldPosition = strategy.position.size;
    const oldSign = Math.sign(oldPosition);
    
    // Check if we are reducing/reversing the position
    // (Long position and selling, or Short position and buying)
    const isReducing = (oldSign === 1 && direction === -1) || (oldSign === -1 && direction === 1);

    if (isReducing) {
        // We are reducing or reversing
        // First, use the order to close existing trades
        const qtyToClose = Math.min(Math.abs(oldPosition), order.qty);
        closePartialPosition(context, qtyToClose, fillPrice, fillTime);

        // If there is remaining quantity (reversal), open a new trade
        const remainingQty = order.qty - qtyToClose;
        if (remainingQty > 0) {
            openTrade(context, order.id, direction, remainingQty, fillPrice, fillTime);
        }
    } else {
        // We are increasing position or opening fresh
        openTrade(context, order.id, direction, order.qty, fillPrice, fillTime);
    }
}

/**
 * Close partial or full position
 */
export function closePartialPosition(context: any, qtyToClose: number, exitPrice: number, exitTime: number): void {
    const strategy: StrategyState = context.strategy;
    let remainingQty = qtyToClose;

    // Close trades from oldest to newest (FIFO)
    const tradesToClose = [...strategy.openTrades];
    strategy.openTrades = [];

    for (const trade of tradesToClose) {
        if (remainingQty <= 0) {
            // Keep this trade open
            strategy.openTrades.push(trade);
            continue;
        }

        const qtyClosing = Math.min(trade.qty, remainingQty);

        if (qtyClosing >= trade.qty) {
            // Fully close this trade
            trade.status = 'closed';
            trade.exitPrice = exitPrice;
            trade.exitBar = context.idx;
            trade.exitTime = exitTime;

            // Calculate profit
            const priceChange = trade.direction === 1 ? exitPrice - trade.entryPrice : trade.entryPrice - exitPrice;
            trade.profit = priceChange * trade.qty;

            // Update gross profit/loss
            if (trade.profit > 0) {
                strategy.grossProfit += trade.profit;
            } else {
                strategy.grossLoss += Math.abs(trade.profit);
            }

            strategy.closedTrades.push(trade);
            remainingQty -= qtyClosing;
        } else {
            // Partially close this trade - split it
            const closedPortion: Trade = {
                ...trade,
                id: `trade_${strategy.trades.length}`,
                qty: qtyClosing,
                status: 'closed',
                exitPrice,
                exitBar: context.idx,
                exitTime,
            };

            // Calculate profit for closed portion
            const priceChange = trade.direction === 1 ? exitPrice - trade.entryPrice : trade.entryPrice - exitPrice;
            closedPortion.profit = priceChange * qtyClosing;

            // Update gross profit/loss
            if (closedPortion.profit > 0) {
                strategy.grossProfit += closedPortion.profit;
            } else {
                strategy.grossLoss += Math.abs(closedPortion.profit);
            }

            strategy.trades.push(closedPortion);
            strategy.closedTrades.push(closedPortion);

            // Keep the remaining portion open
            trade.qty -= qtyClosing;
            strategy.openTrades.push(trade);
            remainingQty = 0;
        }
    }

    // Update net profit
    strategy.netProfit = strategy.grossProfit - strategy.grossLoss;

    // Update position size
    const currentSize = strategy.position.size;
    const sizeReduction = Math.sign(currentSize) * qtyToClose; // Reduce magnitude
    const newSize = currentSize - sizeReduction;

    strategy.position.size = newSize;

    if (newSize === 0) {
        strategy.position.avgPrice = 0;
        strategy.position.direction = 0;
    } else {
        // Recalculate average price from remaining open trades
        // This is crucial because closing older trades (FIFO) changes the weighted average price
        // of the remaining position if the position was built from multiple entries at different prices.
        if (strategy.openTrades.length > 0) {
            let totalCost = 0;
            let totalQty = 0;
            for (const trade of strategy.openTrades) {
                totalCost += trade.qty * trade.entryPrice;
                totalQty += trade.qty;
            }
            strategy.position.avgPrice = totalCost / totalQty;
        }
    }
}

/**
 * Update unrealized P&L for open trades
 */
function updateUnrealizedPnL(context: any, currentPrice: number): void {
    const strategy: StrategyState = context.strategy;

    let unrealizedPnL = 0;
    for (const trade of strategy.openTrades) {
        const priceChange = trade.direction === 1 ? currentPrice - trade.entryPrice : trade.entryPrice - currentPrice;
        unrealizedPnL += priceChange * trade.qty;
    }

    console.log(`[DEBUG PnL] price=${currentPrice}, unrealized=${unrealizedPnL}, net=${strategy.netProfit}, initial=${strategy.initialCapital}`);

    // Update equity with unrealized P&L
    strategy.equity = strategy.initialCapital + strategy.netProfit + unrealizedPnL;
}

/**
 * Update strategy metrics
 */
function updateStrategyMetrics(context: any): void {
    const strategy: StrategyState = context.strategy;

    // Net profit is already calculated when trades close
    // Equity is updated with unrealized P&L

    // Additional metrics can be calculated here
    // (win rate, max drawdown, etc.)
}

/**
 * Initialize strategy state
 */
export function initializeStrategy(context: any, config: any): void {
    const defaults = {
        title: '',
        shorttitle: '',
        overlay: false,
        format: 'inherit',
        precision: 10,
        scale: 'right',
        pyramiding: 1,
        calc_on_order_fills: false,
        calc_on_every_tick: false,
        max_bars_back: 0,
        backtest_fill_limits_assumption: 0,
        default_qty_type: 'fixed',
        default_qty_value: 1,
        initial_capital: 1000000,
        currency: 'USD',
        slippage: 0,
        commission_type: 'percent',
        commission_value: 0,
        margin_long: 100,
        margin_short: 100,
        explicit_plot_zorder: false,
        max_lines_count: 50,
        max_labels_count: 50,
        max_boxes_count: 50,
        max_polylines_count: 50,
        risk_free_rate: 2,
        use_bar_magnifier: false,
        fill_orders_on_standard_ohlc: false,
    };

    const finalConfig = { ...defaults, ...config };
    const initialCapital = finalConfig.initial_capital;

    context.strategy = {
        config: finalConfig,
        trades: [],
        openTrades: [],
        closedTrades: [],
        position: {
            size: 0,
            avgPrice: 0,
            direction: 0,
            entryBar: 0,
        },
        equity: initialCapital,
        netProfit: 0,
        grossProfit: 0,
        grossLoss: 0,
        pendingOrders: [],
        initialCapital,
    };
}
