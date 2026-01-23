// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../Series';
import {
    Trade,
    PendingOrder,
    StrategyState,
    StrategyOptions,
    DEFAULT_STRATEGY_OPTIONS,
    direction,
    commission_type,
} from './types';

/**
 * Strategy backtesting engine
 * Handles order execution, position management, and P&L tracking
 */
export class StrategyEngine {
    private context: any;
    private state: StrategyState;
    private _tradeIdCounter: number = 0;
    private _orderIdCounter: number = 0;

    constructor(context: any) {
        this.context = context;
        this.state = this.createInitialState();
    }

    private createInitialState(): StrategyState {
        return {
            options: { ...DEFAULT_STRATEGY_OPTIONS },
            position_size: 0,
            position_avg_price: 0,
            position_entry_name: '',
            position_entry_bar_index: -1,
            position_entry_time: 0,
            open_trades: [],
            closed_trades: [],
            pending_orders: [],
            equity: DEFAULT_STRATEGY_OPTIONS.initial_capital,
            initial_capital: DEFAULT_STRATEGY_OPTIONS.initial_capital,
        };
    }

    /**
     * Initialize strategy with options
     */
    initialize(options: Partial<StrategyOptions>): void {
        this.state.options = { ...DEFAULT_STRATEGY_OPTIONS, ...options };
        this.state.initial_capital = this.state.options.initial_capital || 100000;
        this.state.equity = this.state.initial_capital;
    }

    /**
     * Process pending orders at the start of each bar
     * This simulates order execution based on OHLC data
     */
    processOrders(): void {
        const idx = this.context.idx;
        const open = this.getPrice('open');
        const high = this.getPrice('high');
        const low = this.getPrice('low');
        const close = this.getPrice('close');
        const time = this.getTime();

        // Process pending entry/exit orders
        const ordersToProcess = [...this.state.pending_orders];
        this.state.pending_orders = [];

        for (const order of ordersToProcess) {
            const fillResult = this.checkOrderFill(order, open, high, low, close);
            if (fillResult.filled) {
                this.executeOrder(order, fillResult.price, idx, time);
            } else {
                // Keep unfilled orders for next bar
                this.state.pending_orders.push(order);
            }
        }

        // Update equity
        this.updateEquity();
    }

    /**
     * Check if an order should be filled based on OHLC data
     */
    private checkOrderFill(
        order: PendingOrder,
        open: number,
        high: number,
        low: number,
        close: number
    ): { filled: boolean; price: number } {
        // Market orders fill at open
        if (!order.limit && !order.stop) {
            return { filled: true, price: this.applySlippage(open, order.direction) };
        }

        // Stop orders
        if (order.stop && !order.limit) {
            if (order.direction === 'long') {
                // Buy stop: triggered when price goes above stop
                if (high >= order.stop) {
                    const fillPrice = Math.max(open, order.stop);
                    return { filled: true, price: this.applySlippage(fillPrice, order.direction) };
                }
            } else {
                // Sell stop: triggered when price goes below stop
                if (low <= order.stop) {
                    const fillPrice = Math.min(open, order.stop);
                    return { filled: true, price: this.applySlippage(fillPrice, order.direction) };
                }
            }
        }

        // Limit orders
        if (order.limit && !order.stop) {
            if (order.direction === 'long') {
                // Buy limit: triggered when price goes below limit
                if (low <= order.limit) {
                    const fillPrice = Math.min(open, order.limit);
                    return { filled: true, price: this.applySlippage(fillPrice, order.direction) };
                }
            } else {
                // Sell limit: triggered when price goes above limit
                if (high >= order.limit) {
                    const fillPrice = Math.max(open, order.limit);
                    return { filled: true, price: this.applySlippage(fillPrice, order.direction) };
                }
            }
        }

        // Stop-limit orders
        if (order.stop && order.limit) {
            if (order.direction === 'long') {
                // Buy stop-limit: stop triggers the limit order
                if (high >= order.stop && low <= order.limit) {
                    return { filled: true, price: this.applySlippage(order.limit, order.direction) };
                }
            } else {
                // Sell stop-limit: stop triggers the limit order
                if (low <= order.stop && high >= order.limit) {
                    return { filled: true, price: this.applySlippage(order.limit, order.direction) };
                }
            }
        }

        return { filled: false, price: 0 };
    }

    /**
     * Apply slippage to fill price
     */
    private applySlippage(price: number, dir: 'long' | 'short'): number {
        const slippage = this.state.options.slippage || 0;
        if (dir === 'long') {
            return price * (1 + slippage / 100);
        } else {
            return price * (1 - slippage / 100);
        }
    }

    /**
     * Execute an order and update position
     */
    private executeOrder(order: PendingOrder, fillPrice: number, barIndex: number, time: number): void {
        const commission = this.calculateCommission(order.qty, fillPrice);

        // Handle exit orders - only close position, don't open new one
        if (order.isExit) {
            this.closePosition(fillPrice, barIndex, time, order.qty, order.id);
        } else if (order.direction === 'long') {
            this.openLongPosition(order, fillPrice, barIndex, time, commission);
        } else {
            this.openShortPosition(order, fillPrice, barIndex, time, commission);
        }

        // Handle OCA (One-Cancels-All) orders
        if (order.oca_name) {
            this.handleOCA(order);
        }
    }

    /**
     * Open a long position
     */
    private openLongPosition(
        order: PendingOrder,
        fillPrice: number,
        barIndex: number,
        time: number,
        commission: number
    ): void {
        const currentSize = this.state.position_size;

        if (currentSize < 0) {
            // Currently short, close short first
            this.closePosition(fillPrice, barIndex, time, Math.abs(currentSize), order.id);
        }

        // Check pyramiding
        const openLongTrades = this.state.open_trades.filter((t) => t.direction === 'long').length;
        if (openLongTrades >= (this.state.options.pyramiding || 0) + 1 && currentSize > 0) {
            return; // Cannot add more to position
        }

        const trade: Trade = {
            id: this.generateTradeId(),
            entry_id: order.id,
            entry_bar_index: barIndex,
            entry_time: time,
            entry_price: fillPrice,
            size: order.qty,
            direction: 'long',
            commission: commission,
            max_runup: 0,
            max_drawdown: 0,
        };

        this.state.open_trades.push(trade);

        // Update position
        if (currentSize >= 0) {
            const totalSize = currentSize + order.qty;
            const totalCost = this.state.position_avg_price * currentSize + fillPrice * order.qty;
            this.state.position_avg_price = totalCost / totalSize;
            this.state.position_size = totalSize;
        } else {
            this.state.position_size = order.qty;
            this.state.position_avg_price = fillPrice;
        }

        if (this.state.position_entry_bar_index === -1) {
            this.state.position_entry_bar_index = barIndex;
            this.state.position_entry_time = time;
            this.state.position_entry_name = order.id;
        }

        // Deduct commission from equity
        this.state.equity -= commission;
    }

    /**
     * Open a short position
     */
    private openShortPosition(
        order: PendingOrder,
        fillPrice: number,
        barIndex: number,
        time: number,
        commission: number
    ): void {
        const currentSize = this.state.position_size;

        if (currentSize > 0) {
            // Currently long, close long first
            this.closePosition(fillPrice, barIndex, time, currentSize, order.id);
        }

        // Check pyramiding
        const openShortTrades = this.state.open_trades.filter((t) => t.direction === 'short').length;
        if (openShortTrades >= (this.state.options.pyramiding || 0) + 1 && currentSize < 0) {
            return; // Cannot add more to position
        }

        const trade: Trade = {
            id: this.generateTradeId(),
            entry_id: order.id,
            entry_bar_index: barIndex,
            entry_time: time,
            entry_price: fillPrice,
            size: order.qty,
            direction: 'short',
            commission: commission,
            max_runup: 0,
            max_drawdown: 0,
        };

        this.state.open_trades.push(trade);

        // Update position
        if (currentSize <= 0) {
            const totalSize = Math.abs(currentSize) + order.qty;
            const totalCost = this.state.position_avg_price * Math.abs(currentSize) + fillPrice * order.qty;
            this.state.position_avg_price = totalCost / totalSize;
            this.state.position_size = -totalSize;
        } else {
            this.state.position_size = -order.qty;
            this.state.position_avg_price = fillPrice;
        }

        if (this.state.position_entry_bar_index === -1) {
            this.state.position_entry_bar_index = barIndex;
            this.state.position_entry_time = time;
            this.state.position_entry_name = order.id;
        }

        // Deduct commission from equity
        this.state.equity -= commission;
    }

    /**
     * Close a position
     */
    closePosition(
        exitPrice: number,
        barIndex: number,
        time: number,
        qty: number,
        exitId: string
    ): void {
        const closeRule = this.state.options.close_entries_rule || 'FIFO';
        let remainingQty = qty;

        // Sort trades based on close rule
        const sortedTrades = [...this.state.open_trades];
        if (closeRule === 'FIFO') {
            sortedTrades.sort((a, b) => a.entry_bar_index - b.entry_bar_index);
        } else {
            // ANY - close in reverse order (most recent first)
            sortedTrades.sort((a, b) => b.entry_bar_index - a.entry_bar_index);
        }

        for (const trade of sortedTrades) {
            if (remainingQty <= 0) break;

            const closeQty = Math.min(trade.size, remainingQty);
            const commission = this.calculateCommission(closeQty, exitPrice);

            // Calculate profit
            let profit: number;
            if (trade.direction === 'long') {
                profit = (exitPrice - trade.entry_price) * closeQty - (trade.commission || 0) - commission;
            } else {
                profit = (trade.entry_price - exitPrice) * closeQty - (trade.commission || 0) - commission;
            }

            const profitPercent = (profit / (trade.entry_price * closeQty)) * 100;

            if (closeQty === trade.size) {
                // Close entire trade
                trade.exit_id = exitId;
                trade.exit_bar_index = barIndex;
                trade.exit_time = time;
                trade.exit_price = exitPrice;
                trade.profit = profit;
                trade.profit_percent = profitPercent;
                trade.commission = (trade.commission || 0) + commission;

                this.state.closed_trades.push(trade);
                this.state.open_trades = this.state.open_trades.filter((t) => t.id !== trade.id);
            } else {
                // Partial close
                const closedTrade: Trade = {
                    ...trade,
                    id: this.generateTradeId(),
                    size: closeQty,
                    exit_id: exitId,
                    exit_bar_index: barIndex,
                    exit_time: time,
                    exit_price: exitPrice,
                    profit: profit,
                    profit_percent: profitPercent,
                    commission: (trade.commission || 0) * (closeQty / trade.size) + commission,
                };
                this.state.closed_trades.push(closedTrade);

                // Update remaining trade
                trade.size -= closeQty;
                trade.commission = (trade.commission || 0) * ((trade.size + closeQty) / trade.size);
            }

            // Update equity
            this.state.equity += profit;
            remainingQty -= closeQty;
        }

        // Update position
        if (this.state.open_trades.length === 0) {
            this.state.position_size = 0;
            this.state.position_avg_price = 0;
            this.state.position_entry_bar_index = -1;
            this.state.position_entry_time = 0;
            this.state.position_entry_name = '';
        } else {
            // Recalculate position
            let totalSize = 0;
            let totalCost = 0;
            for (const t of this.state.open_trades) {
                const sign = t.direction === 'long' ? 1 : -1;
                totalSize += t.size * sign;
                totalCost += t.entry_price * t.size;
            }
            this.state.position_size = totalSize;
            this.state.position_avg_price = totalCost / Math.abs(totalSize);
        }
    }

    /**
     * Close all positions
     */
    closeAllPositions(exitId: string = 'close_all'): void {
        const currentPrice = this.getPrice('close');
        const barIndex = this.context.idx;
        const time = this.getTime();

        const totalQty = this.state.open_trades.reduce((sum, t) => sum + t.size, 0);
        if (totalQty > 0) {
            this.closePosition(currentPrice, barIndex, time, totalQty, exitId);
        }
    }

    /**
     * Handle OCA (One-Cancels-All) orders
     */
    private handleOCA(filledOrder: PendingOrder): void {
        if (!filledOrder.oca_name) return;

        const ocaType = filledOrder.oca_type || 'none';
        if (ocaType === 'none') return;

        if (ocaType === 'cancel') {
            // Cancel all other orders in the same OCA group
            this.state.pending_orders = this.state.pending_orders.filter(
                (o) => o.oca_name !== filledOrder.oca_name
            );
        } else if (ocaType === 'reduce') {
            // Reduce qty of other orders in the same OCA group
            for (const order of this.state.pending_orders) {
                if (order.oca_name === filledOrder.oca_name) {
                    order.qty = Math.max(0, order.qty - filledOrder.qty);
                }
            }
            // Remove orders with zero qty
            this.state.pending_orders = this.state.pending_orders.filter((o) => o.qty > 0);
        }
    }

    /**
     * Calculate commission for a trade
     */
    private calculateCommission(qty: number, price: number): number {
        const commType = this.state.options.commission_type || 'percent';
        const commValue = this.state.options.commission_value || 0;

        switch (commType) {
            case 'percent':
                return (price * qty * commValue) / 100;
            case 'cash_per_contract':
                return qty * commValue;
            case 'cash_per_order':
                return commValue;
            default:
                return 0;
        }
    }

    /**
     * Update equity based on open positions
     */
    private updateEquity(): void {
        const currentPrice = this.getPrice('close');
        let openProfit = 0;

        for (const trade of this.state.open_trades) {
            if (trade.direction === 'long') {
                openProfit += (currentPrice - trade.entry_price) * trade.size;
            } else {
                openProfit += (trade.entry_price - currentPrice) * trade.size;
            }

            // Update max runup/drawdown
            const tradeProfit =
                trade.direction === 'long'
                    ? (currentPrice - trade.entry_price) * trade.size
                    : (trade.entry_price - currentPrice) * trade.size;

            trade.max_runup = Math.max(trade.max_runup || 0, tradeProfit);
            trade.max_drawdown = Math.min(trade.max_drawdown || 0, tradeProfit);
        }

        this.state.equity = this.state.initial_capital + this.getNetProfit() + openProfit;
    }

    /**
     * Add a pending order
     */
    addOrder(order: Omit<PendingOrder, 'bar_index'>): void {
        this.state.pending_orders.push({
            ...order,
            bar_index: this.context.idx,
        });
    }

    /**
     * Cancel a pending order by ID
     */
    cancelOrder(orderId: string): boolean {
        const initialLength = this.state.pending_orders.length;
        this.state.pending_orders = this.state.pending_orders.filter((o) => o.id !== orderId);
        return this.state.pending_orders.length < initialLength;
    }

    /**
     * Cancel all pending orders
     */
    cancelAllOrders(): void {
        this.state.pending_orders = [];
    }

    // ==================== Getters ====================

    getState(): StrategyState {
        return this.state;
    }

    getPositionSize(): number {
        return this.state.position_size;
    }

    getPositionAvgPrice(): number {
        return this.state.position_avg_price;
    }

    getEquity(): number {
        return this.state.equity;
    }

    getInitialCapital(): number {
        return this.state.initial_capital;
    }

    getOpenProfit(): number {
        const currentPrice = this.getPrice('close');
        let openProfit = 0;

        for (const trade of this.state.open_trades) {
            if (trade.direction === 'long') {
                openProfit += (currentPrice - trade.entry_price) * trade.size;
            } else {
                openProfit += (trade.entry_price - currentPrice) * trade.size;
            }
        }

        return openProfit;
    }

    getNetProfit(): number {
        return this.state.closed_trades.reduce((sum, t) => sum + (t.profit || 0), 0);
    }

    getGrossProfit(): number {
        return this.state.closed_trades.filter((t) => (t.profit || 0) > 0).reduce((sum, t) => sum + (t.profit || 0), 0);
    }

    getGrossLoss(): number {
        return Math.abs(
            this.state.closed_trades.filter((t) => (t.profit || 0) < 0).reduce((sum, t) => sum + (t.profit || 0), 0)
        );
    }

    getOpenTrades(): Trade[] {
        return this.state.open_trades;
    }

    getClosedTrades(): Trade[] {
        return this.state.closed_trades;
    }

    getOpenTradesCount(): number {
        return this.state.open_trades.length;
    }

    getClosedTradesCount(): number {
        return this.state.closed_trades.length;
    }

    getWinTrades(): number {
        return this.state.closed_trades.filter((t) => (t.profit || 0) > 0).length;
    }

    getLossTrades(): number {
        return this.state.closed_trades.filter((t) => (t.profit || 0) < 0).length;
    }

    getEventrades(): number {
        return this.state.closed_trades.filter((t) => (t.profit || 0) === 0).length;
    }

    getWinRate(): number {
        const total = this.getClosedTradesCount();
        if (total === 0) return 0;
        return (this.getWinTrades() / total) * 100;
    }

    getAvgTrade(): number {
        const total = this.getClosedTradesCount();
        if (total === 0) return 0;
        return this.getNetProfit() / total;
    }

    getAvgWinningTrade(): number {
        const winners = this.state.closed_trades.filter((t) => (t.profit || 0) > 0);
        if (winners.length === 0) return 0;
        return winners.reduce((sum, t) => sum + (t.profit || 0), 0) / winners.length;
    }

    getAvgLosingTrade(): number {
        const losers = this.state.closed_trades.filter((t) => (t.profit || 0) < 0);
        if (losers.length === 0) return 0;
        return losers.reduce((sum, t) => sum + (t.profit || 0), 0) / losers.length;
    }

    getMaxDrawdown(): number {
        let peak = this.state.initial_capital;
        let maxDrawdown = 0;
        let equity = this.state.initial_capital;

        for (const trade of this.state.closed_trades) {
            equity += trade.profit || 0;
            peak = Math.max(peak, equity);
            const drawdown = peak - equity;
            maxDrawdown = Math.max(maxDrawdown, drawdown);
        }

        return maxDrawdown;
    }

    getMaxRunup(): number {
        let trough = this.state.initial_capital;
        let maxRunup = 0;
        let equity = this.state.initial_capital;

        for (const trade of this.state.closed_trades) {
            equity += trade.profit || 0;
            trough = Math.min(trough, equity);
            const runup = equity - trough;
            maxRunup = Math.max(maxRunup, runup);
        }

        return maxRunup;
    }

    getProfitFactor(): number {
        const grossProfit = this.getGrossProfit();
        const grossLoss = this.getGrossLoss();
        if (grossLoss === 0) return grossProfit > 0 ? Infinity : 0;
        return grossProfit / grossLoss;
    }

    getSharpeRatio(): number {
        if (this.state.closed_trades.length < 2) return 0;

        const returns = this.state.closed_trades.map((t) => t.profit || 0);
        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
        const stdDev = Math.sqrt(variance);

        if (stdDev === 0) return 0;

        const riskFreeRate = (this.state.options.risk_free_rate || 0) / 100;
        return (avgReturn - riskFreeRate) / stdDev;
    }

    // ==================== Helpers ====================

    private getPrice(field: 'open' | 'high' | 'low' | 'close'): number {
        const data = this.context.data[field];
        if (data instanceof Series) {
            return data.get(0);
        }
        return data;
    }

    private getTime(): number {
        const openTime = this.context.data.openTime;
        if (openTime instanceof Series) {
            return openTime.get(0);
        }
        if (Array.isArray(openTime)) {
            return openTime[openTime.length - 1];
        }
        return Date.now();
    }

    private generateTradeId(): string {
        return `trade_${++this._tradeIdCounter}`;
    }

    generateOrderId(): string {
        return `order_${++this._orderIdCounter}`;
    }

    /**
     * Get default quantity based on strategy options
     */
    getDefaultQty(): number {
        const qtyType = this.state.options.default_qty_type || 'fixed';
        const qtyValue = this.state.options.default_qty_value || 1;

        if (qtyType === 'fixed') {
            return qtyValue;
        } else if (qtyType === 'cash') {
            const price = this.getPrice('close');
            return Math.floor(qtyValue / price);
        } else if (qtyType === 'percent_of_equity') {
            const price = this.getPrice('close');
            const equityAmount = (this.state.equity * qtyValue) / 100;
            return Math.floor(equityAmount / price);
        }

        return qtyValue;
    }
}
