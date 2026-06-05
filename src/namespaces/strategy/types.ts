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

    // Internal: set on `strategy.entry` orders that REVERSE the current
    // position (opposite direction with existing size). Used by
    // `strategy.exit` to detect when its absolute limit/stop values were
    // computed from the OUTGOING position's avg (i.e. stale): the user
    // typically writes `stop = strategy.position_avg_price + N` on the
    // crossunder bar, but at that point position_avg_price still reflects
    // the position being reversed away. TV silently ignores stale legs;
    // PT drops them at trigger evaluation (see processExitOrders).
    _isReversalEntry?: boolean;
    _attachedAtReversal?: boolean;

    // Internal: cadence-detection for strategy.exit. TV's broker
    // emulator uses Pine's lazy series-eval semantic for exit
    // parameters — the variable behind limit/stop is re-read each bar.
    // For a variable scoped INSIDE an if-block (sparse pattern), that
    // gives NA on non-trigger bars → TV doesn't fire stale captures.
    // For a variable in MAIN scope (persistent pattern, called every
    // bar), TV reads the captured value → fires stale captures.
    //
    // PT can't see the variable's scope from runtime, but the call
    // CADENCE (how often the user calls strategy.exit per call site)
    // correlates 1:1. Detected at queue time: if the user called this
    // exit's callsite on the PRIOR bar, `_isPersistent = true`. Used
    // by processExitOrders to suppress the stale-reversal drop on
    // persistent-pattern exits.
    _isPersistent?: boolean;
    _callsiteId?: string;
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
    // Max-Equity snapshot (running high-water of realized equity) at the
    // moment max_drawdown was last bumped to a new peak. Used as the
    // denominator of max_drawdown_percent — TV's empirical behavior is
    // ddpct = max_drawdown / Max_Equity-at-latch × 100, NOT against
    // initial_capital or current equity_peak.
    equity_at_drawdown_peak: number;

    // Running max of `(latched_drawdown / equity_at_that_latch) × 100` and
    // `(latched_runup / equity_at_that_latch) × 100` across the strategy's
    // lifetime. Pine's max_drawdown_percent / max_runup_percent are the
    // HIGHEST RATIO observed across all latch events — NOT
    // (current_max_value / current_equity_at_peak). The two interpretations
    // diverge when a later latch produces a larger absolute value but a
    // smaller percentage (because equity grew faster than the latched
    // metric), so the running-max formulation is the only one that
    // matches the spec.
    max_drawdown_percent_value: number;
    max_runup_percent_value: number;

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

    // Internal: per-callsite cadence tracking for strategy.exit. Keyed by the
    // transpiler-injected __callsiteId; value is the last context.idx the user
    // called strategy.exit at that site. Read at queue time to detect whether
    // the prior bar also called this site (persistent pattern) or not (sparse
    // / inside-if-block pattern). See Order._isPersistent.
    _exit_call_history?: Map<string, number>;
    // Fallback counter for non-transpiled callers (no __callsiteId injection)
    // — paired with per-bar reset so each "first-of-bar" raw call gets a
    // stable synthetic id like `exit_raw_N`.
    _exit_fallback_counter?: number;
    _exit_fallback_last_bar?: number;
}
