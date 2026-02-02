// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

/**
 * Strategy configuration options
 */
export interface StrategyConfig {
    title: string;
    shorttitle?: string;
    overlay: boolean;
    format?: string;
    precision?: number;
    scale?: string;
    pyramiding?: number;
    calc_on_order_fills?: boolean;
    calc_on_every_tick?: boolean;
    max_bars_back?: number;
    backtest_fill_limits_assumption?: number;
    default_qty_type?: string;
    default_qty_value?: number;
    initial_capital?: number;
    currency?: string;
    slippage?: number;
    commission_type?: string;
    commission_value?: number;
    margin_long?: number;
    margin_short?: number;
    explicit_plot_zorder?: boolean;
    max_lines_count?: number;
    max_labels_count?: number;
    max_boxes_count?: number;
    max_polylines_count?: number;
    risk_free_rate?: number;
    use_bar_magnifier?: boolean;
    fill_orders_on_standard_ohlc?: boolean;
}

/**
 * Trade object representing an individual trade
 */
export interface Trade {
    id: string;
    entryId: string;
    direction: number; // 1 for long, -1 for short
    qty: number;
    entryPrice: number;
    entryBar: number;
    entryTime: number;
    exitPrice?: number;
    exitBar?: number;
    exitTime?: number;
    profit?: number;
    status: 'open' | 'closed';
}

/**
 * Order object representing a pending or filled order
 */
export interface Order {
    id: string;
    direction: number | string; // 1 or 'long', -1 or 'short'
    qty: number;
    type: 'market' | 'limit' | 'stop' | 'stop-limit';
    limitPrice?: number;
    stopPrice?: number;
    bar: number;
    time: number;
    fillPrice?: number;
    fillBar?: number;
    fillTime?: number;
    status: 'pending' | 'filled' | 'cancelled';
}

/**
 * Position tracking
 */
export interface Position {
    size: number; // Positive for long, negative for short, 0 for flat
    avgPrice: number;
    direction: number; // 1 for long, -1 for short, 0 for flat
    entryBar: number;
}

/**
 * Strategy state stored in context
 */
export interface StrategyState {
    config: StrategyConfig;
    trades: Trade[];
    openTrades: Trade[];
    closedTrades: Trade[];
    position: Position;
    equity: number;
    netProfit: number;
    grossProfit: number;
    grossLoss: number;
    pendingOrders: Order[];
    initialCapital: number;
}
