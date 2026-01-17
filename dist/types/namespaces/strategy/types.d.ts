/**
 * Strategy direction constants
 */
export declare const direction: {
    readonly long: "long";
    readonly short: "short";
    readonly all: "all";
};
/**
 * Order type constants
 */
export declare const oca_type: {
    readonly none: "none";
    readonly cancel: "cancel";
    readonly reduce: "reduce";
};
/**
 * Commission type constants
 */
export declare const commission_type: {
    readonly percent: "percent";
    readonly cash_per_contract: "cash_per_contract";
    readonly cash_per_order: "cash_per_order";
};
/**
 * Position constants
 */
export declare const position: {
    readonly long: 1;
    readonly short: -1;
    readonly flat: 0;
};
/**
 * Account currency constants
 */
export declare const account_currency = "USD";
/**
 * Cash constants for qty calculations
 */
export declare const cash = "cash";
export declare const fixed = "fixed";
export declare const percent_of_equity = "percent_of_equity";
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
    isExit?: boolean;
}
/**
 * Default strategy options
 */
export declare const DEFAULT_STRATEGY_OPTIONS: StrategyOptions;
