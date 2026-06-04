// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

/**
 * Strategy configuration options.
 *
 * Field names mirror Pine's strategy() declaration parameters exactly
 * (snake_case, single-word where Pine uses one word). See
 * https://www.tradingview.com/pine-script-reference/v5/#fun_strategy
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
    process_orders_on_close?: boolean;
    close_entries_rule?: string;
    margin_long?: number;
    margin_short?: number;
    explicit_plot_zorder?: boolean;
    max_lines_count?: number;
    max_labels_count?: number;
    max_boxes_count?: number;
    max_polylines_count?: number;
    calc_bars_count?: number;
    risk_free_rate?: number;
    use_bar_magnifier?: boolean;
    fill_orders_on_standard_ohlc?: boolean;
    dynamic_requests?: boolean;
    behind_chart?: boolean;
}

/**
 * A single trade — either currently open or already closed.
 *
 * Field names mirror Pine's per-trade getters from
 * strategy.closedtrades.*(idx) / strategy.opentrades.*(idx).
 *
 * `size` is SIGNED to match Pine: positive = long, negative = short.
 * The historical direction/qty pair has been collapsed into this single
 * field, matching what `strategy.closedtrades.size(idx)` returns.
 */
export interface Trade {
    id: string;                  // unique trade id (internal)
    entry_id: string;            // id passed to strategy.entry()
    entry_price: number;
    entry_bar_index: number;
    entry_time: number;
    entry_comment?: string;
    exit_id?: string;            // id passed to strategy.exit/close — set on close
    exit_price?: number;
    exit_bar_index?: number;
    exit_time?: number;
    exit_comment?: string;
    size: number;                // SIGNED — positive long, negative short
    profit?: number;             // realized P&L on close; undefined while open
    commission?: number;         // commission charged on this trade
    max_drawdown?: number;       // per-trade peak drawdown from entry
    max_runup?: number;          // per-trade peak runup from entry
    status: 'open' | 'closed';
}

/**
 * A pending or filled order tracked internally by the engine.
 *
 * No Pine API exposes pending orders directly. Field names follow Pine's
 * `strategy.entry()` / `strategy.order()` parameter names where they map
 * (`limit`, `stop`, `oca_name`, `oca_type`), and snake_case for the rest.
 */
export interface Order {
    id: string;
    direction: number;           // +1 long, -1 short
    qty: number;                 // unsigned
    type: 'market' | 'limit' | 'stop' | 'stop-limit';
    limit?: number;              // matches strategy.entry(limit=...)
    stop?: number;               // matches strategy.entry(stop=...)
    bar: number;
    time: number;
    oca_name?: string;
    oca_type?: 'cancel' | 'reduce' | 'none';
    comment?: string;
    fill_price?: number;
    fill_bar?: number;
    fill_time?: number;
    status: 'pending' | 'filled' | 'cancelled';

    // Distinguishes pending entries (market/limit/stop) from conditional
    // exit orders that ride on open positions. Defaults to 'entry' when
    // unset for backward-compat.
    category?: 'entry' | 'exit';

    // Exit-specific fields (only set when category === 'exit').
    // strategy.exit() parameters: profit (TP in ticks), loss (SL in ticks),
    // limit/stop (price-based TP/SL), trail_price/trail_offset/trail_points
    // (trailing-stop trio), from_entry (which entries to attach to;
    // empty/"" or undefined means "all"), qty / qty_percent (partial close).
    profit?: number;             // TP in ticks
    loss?: number;               // SL in ticks
    trail_price?: number;        // price level at which trailing arms
    trail_offset?: number;       // offset in ticks the trail rides at
    trail_points?: number;       // alternative trail-arm: entry_price + N ticks
    from_entry?: string;         // entry id this exit attaches to ('' = all)
    qty_percent?: number;        // percent of matching position to close
    comment_profit?: string;
    comment_loss?: string;
    comment_trailing?: string;
    alert_message?: string;
    alert_profit?: string;
    alert_loss?: string;
    alert_trailing?: string;
    disable_alert?: boolean;
    immediately?: boolean;       // strategy.close/close_all: fill at current bar's close
    // Internal: tracks the running peak used by trailing-stop logic.
    // For a long: highest high seen since the trail armed; for a short: lowest low.
    trail_peak?: number;
    trail_armed?: boolean;
}

/**
 * Strategy state stored on the Context after a backtest run.
 *
 * Top-level scalars mirror Pine's `strategy.*` properties 1:1 (snake_case,
 * Pine's single-word concatenations like `netprofit` / `grossprofit` /
 * `grossloss` / `openprofit` preserved). Position fields are FLATTENED
 * — Pine exposes `strategy.position_size` / `position_avg_price` /
 * `position_entry_name` as three separate scalars, not a nested object.
 *
 * The `opentrades` / `closedtrades` arrays use Pine's exact names with
 * `.length` providing the count — same semantic as Pine's int count but
 * also indexable for the per-trade getter equivalents.
 */
export interface StrategyState {
    config: StrategyConfig;

    // Trade collections (arrays — `.length` is the Pine count)
    opentrades: Trade[];
    closedtrades: Trade[];
    pending_orders: Order[];

    // Position info — flattened to match Pine's separate-scalars data model
    position_size: number;            // SIGNED (matches strategy.position_size)
    position_avg_price: number;       // NaN when flat (matches Pine semantics)
    position_entry_name: string;      // entry_id that opened current position

    // Account info — matches Pine names exactly
    initial_capital: number;
    account_currency: string;
    equity: number;
    netprofit: number;                // realized only
    grossprofit: number;
    grossloss: number;
    openprofit: number;               // unrealized P&L of open positions

    // Peaks — used by strategy.max_drawdown / strategy.max_runup
    max_drawdown: number;
    max_runup: number;
    // Internal: running high-/low-water marks of REALIZED equity
    // (initial_capital + netprofit). Used symmetrically:
    //   max_drawdown reference is equity_peak  (worst dip below the high)
    //   max_runup    reference is equity_trough (best rise above the low)
    // equity_peak also serves as the denominator of max_drawdown_percent.
    equity_peak: number;
    equity_trough: number;
    // Total equity at the moment max_runup was last bumped — i.e. the
    // intra-bar high-water of (realized + best_unrealized_excursion). Used
    // as the denominator of max_runup_percent (TV reports runup as a
    // percentage of the equity AT the peak, not of initial_capital).
    equity_at_runup_peak: number;

    // Trade-stat counters — updated each time a trade closes
    wintrades: number;                // count of closed trades with profit > 0
    losstrades: number;               // count of closed trades with profit < 0
    eventrades: number;               // count of closed trades with profit === 0
    wintrades_total_profit: number;   // sum of profits across winning closed trades (for avg)
    losstrades_total_loss: number;    // sum of |loss| across losing closed trades (for avg)

    // Position-size peaks (in contracts/units)
    max_contracts_held_all: number;   // max(|position_size|) seen
    max_contracts_held_long: number;  // max(position_size) where > 0
    max_contracts_held_short: number; // max(|position_size|) where < 0

    // Pre-trade risk-management filters (configured via strategy.risk.*).
    // Each rule is optional; if undefined, the rule does not apply.
    risk_rules: {
        allow_entry_in?: 'long' | 'short' | 'all';
        max_cons_loss_days?: { count: number; alert_message?: string };
        max_drawdown?: { value: number; type: 'cash' | 'percent_of_equity' };
        max_intraday_filled_orders?: { count: number; alert_message?: string };
        max_intraday_loss?: { value: number; type: 'cash' | 'percent_of_equity' };
        max_position_size?: number;
    };

    // Once max_drawdown / max_intraday_loss / max_cons_loss_days triggers, all
    // further entries are blocked for the rest of the run (or trading day for
    // intraday rules — TODO: day rollover detection).
    risk_halted: boolean;
}
