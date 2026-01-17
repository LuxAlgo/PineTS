import { Trade, PendingOrder, StrategyState, StrategyOptions } from './types';
/**
 * Strategy backtesting engine
 * Handles order execution, position management, and P&L tracking
 */
export declare class StrategyEngine {
    private context;
    private state;
    private _tradeIdCounter;
    private _orderIdCounter;
    constructor(context: any);
    private createInitialState;
    /**
     * Initialize strategy with options
     */
    initialize(options: Partial<StrategyOptions>): void;
    /**
     * Process pending orders at the start of each bar
     * This simulates order execution based on OHLC data
     */
    processOrders(): void;
    /**
     * Check if an order should be filled based on OHLC data
     */
    private checkOrderFill;
    /**
     * Apply slippage to fill price
     */
    private applySlippage;
    /**
     * Execute an order and update position
     */
    private executeOrder;
    /**
     * Open a long position
     */
    private openLongPosition;
    /**
     * Open a short position
     */
    private openShortPosition;
    /**
     * Close a position
     */
    closePosition(exitPrice: number, barIndex: number, time: number, qty: number, exitId: string): void;
    /**
     * Close all positions
     */
    closeAllPositions(exitId?: string): void;
    /**
     * Handle OCA (One-Cancels-All) orders
     */
    private handleOCA;
    /**
     * Calculate commission for a trade
     */
    private calculateCommission;
    /**
     * Update equity based on open positions
     */
    private updateEquity;
    /**
     * Add a pending order
     */
    addOrder(order: Omit<PendingOrder, 'bar_index'>): void;
    /**
     * Cancel a pending order by ID
     */
    cancelOrder(orderId: string): boolean;
    /**
     * Cancel all pending orders
     */
    cancelAllOrders(): void;
    getState(): StrategyState;
    getPositionSize(): number;
    getPositionAvgPrice(): number;
    getEquity(): number;
    getInitialCapital(): number;
    getOpenProfit(): number;
    getNetProfit(): number;
    getGrossProfit(): number;
    getGrossLoss(): number;
    getOpenTrades(): Trade[];
    getClosedTrades(): Trade[];
    getOpenTradesCount(): number;
    getClosedTradesCount(): number;
    getWinTrades(): number;
    getLossTrades(): number;
    getEventrades(): number;
    getWinRate(): number;
    getAvgTrade(): number;
    getAvgWinningTrade(): number;
    getAvgLosingTrade(): number;
    getMaxDrawdown(): number;
    getMaxRunup(): number;
    getProfitFactor(): number;
    getSharpeRatio(): number;
    private getPrice;
    private getTime;
    private generateTradeId;
    generateOrderId(): string;
    /**
     * Get default quantity based on strategy options
     */
    getDefaultQty(): number;
}
