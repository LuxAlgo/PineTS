// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Strategy direction constants
 */
export const direction = {
    long: 'long',
    short: 'short',
    all: 'all',
} as const;

/**
 * Order type constants
 */
export const oca_type = {
    none: 'none',
    cancel: 'cancel',
    reduce: 'reduce',
} as const;

/**
 * Commission type constants
 */
export const commission_type = {
    percent: 'percent',
    cash_per_contract: 'cash_per_contract',
    cash_per_order: 'cash_per_order',
} as const;

/**
 * Position constants
 */
export const position = {
    long: 1,
    short: -1,
    flat: 0,
} as const;

/**
 * Account currency constants
 */
export const account_currency = 'USD';

/**
 * Cash constants for qty calculations
 */
export const cash = 'cash';
export const fixed = 'fixed';
export const percent_of_equity = 'percent_of_equity';

/**
 * Represents a single trade
 */
export interface Trade {
    id: string;
    entry_id: string;
    entry_bar_index: number;
    entry_time: number;
    entry_price: number;
    size: number;
    direction: 'long' | 'short';
    exit_id?: string;
    exit_bar_index?: number;
    exit_time?: number;
    exit_price?: number;
    profit?: number;
    profit_percent?: number;
    commission?: number;
    max_runup?: number;
    max_drawdown?: number;
}

/**
 * Strategy configuration options
 */
export interface StrategyOptions {
    title: string;
    shorttitle?: string;
    overlay?: boolean;
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
    process_orders_on_close?: boolean;
    close_entries_rule?: string;
    margin_long?: number;
    margin_short?: number;
    explicit_plot_zorder?: boolean;
    max_lines_count?: number;
    max_labels_count?: number;
    max_boxes_count?: number;
    risk_free_rate?: number;
    use_bar_magnifier?: boolean;
    fill_orders_on_standard_ohlc?: boolean;
    max_polylines_count?: number;
}

/**
 * Strategy state for tracking positions and trades
 */
export interface StrategyState {
    options: StrategyOptions;
    position_size: number;
    position_avg_price: number;
    position_entry_name: string;
    position_entry_bar_index: number;
    position_entry_time: number;
    open_trades: Trade[];
    closed_trades: Trade[];
    pending_orders: PendingOrder[];
    equity: number;
    initial_capital: number;
}

/**
 * Pending order
 */
export interface PendingOrder {
    id: string;
    direction: 'long' | 'short';
    qty: number;
    limit?: number;
    stop?: number;
    oca_name?: string;
    oca_type?: string;
    comment?: string;
    alert_message?: string;
    bar_index: number;
    isExit?: boolean; // True if this is an exit order (close position only)
}

/**
 * Default strategy options
 */
export const DEFAULT_STRATEGY_OPTIONS: StrategyOptions = {
    title: 'Strategy',
    overlay: true,
    pyramiding: 0,
    calc_on_order_fills: false,
    calc_on_every_tick: false,
    default_qty_type: 'fixed',
    default_qty_value: 1,
    initial_capital: 100000,
    currency: 'USD',
    slippage: 0,
    commission_type: 'percent',
    commission_value: 0,
    process_orders_on_close: false,
    close_entries_rule: 'FIFO',
    margin_long: 100,
    margin_short: 100,
};
