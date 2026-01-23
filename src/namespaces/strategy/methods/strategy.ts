// SPDX-License-Identifier: AGPL-3.0-only

import { StrategyEngine } from '../StrategyEngine';
import { StrategyOptions } from '../types';

/**
 * strategy() - Initialize a strategy script
 *
 * This function sets the strategy properties.
 *
 * @param title - Strategy title (displayed on chart)
 * @param shorttitle - Short title (for compact display)
 * @param overlay - If true, strategy is displayed on price chart
 * @param format - Price format ('price', 'volume', 'percent')
 * @param precision - Number of decimal places
 * @param scale - Price scale ('right', 'left', 'none')
 * @param pyramiding - Maximum entries in the same direction
 * @param calc_on_order_fills - Recalculate after order fills
 * @param calc_on_every_tick - Calculate on every price update
 * @param max_bars_back - Maximum lookback for series
 * @param backtest_fill_limits_assumption - Bars to fill limit orders
 * @param default_qty_type - Quantity type ('fixed', 'cash', 'percent_of_equity')
 * @param default_qty_value - Default quantity value
 * @param initial_capital - Starting capital for backtesting
 * @param currency - Account currency
 * @param slippage - Slippage in ticks
 * @param commission_type - Commission type
 * @param commission_value - Commission value
 * @param process_orders_on_close - Process orders at bar close
 * @param close_entries_rule - Order of closing entries ('FIFO', 'ANY')
 * @param margin_long - Margin for long positions (%)
 * @param margin_short - Margin for short positions (%)
 * @param explicit_plot_zorder - Explicit plot ordering
 * @param max_lines_count - Maximum line objects
 * @param max_labels_count - Maximum label objects
 * @param max_boxes_count - Maximum box objects
 * @param risk_free_rate - Risk-free rate for Sharpe ratio
 * @param use_bar_magnifier - Use bar magnifier for intrabar data
 * @param fill_orders_on_standard_ohlc - Fill on standard OHLC
 * @param max_polylines_count - Maximum polyline objects
 */
export function strategy(context: any) {
    return (
        title: string,
        shorttitle?: string,
        overlay?: boolean,
        format?: string,
        precision?: number,
        scale?: string,
        pyramiding?: number,
        calc_on_order_fills?: boolean,
        calc_on_every_tick?: boolean,
        max_bars_back?: number,
        backtest_fill_limits_assumption?: number,
        default_qty_type?: string,
        default_qty_value?: number,
        initial_capital?: number,
        currency?: string,
        slippage?: number,
        commission_type?: string,
        commission_value?: number,
        process_orders_on_close?: boolean,
        close_entries_rule?: string,
        margin_long?: number,
        margin_short?: number,
        explicit_plot_zorder?: boolean,
        max_lines_count?: number,
        max_labels_count?: number,
        max_boxes_count?: number,
        risk_free_rate?: number,
        use_bar_magnifier?: boolean,
        fill_orders_on_standard_ohlc?: boolean,
        max_polylines_count?: number
    ) => {
        // Initialize strategy engine if not already done
        if (!context._strategyEngine) {
            context._strategyEngine = new StrategyEngine(context);
        }

        const options: Partial<StrategyOptions> = {
            title,
            shorttitle,
            overlay: overlay ?? true,
            format,
            precision,
            scale,
            pyramiding: pyramiding ?? 0,
            calc_on_order_fills: calc_on_order_fills ?? false,
            calc_on_every_tick: calc_on_every_tick ?? false,
            max_bars_back,
            backtest_fill_limits_assumption,
            default_qty_type: default_qty_type ?? 'fixed',
            default_qty_value: default_qty_value ?? 1,
            initial_capital: initial_capital ?? 100000,
            currency: currency ?? 'USD',
            slippage: slippage ?? 0,
            commission_type: commission_type ?? 'percent',
            commission_value: commission_value ?? 0,
            process_orders_on_close: process_orders_on_close ?? false,
            close_entries_rule: close_entries_rule ?? 'FIFO',
            margin_long: margin_long ?? 100,
            margin_short: margin_short ?? 100,
            explicit_plot_zorder,
            max_lines_count,
            max_labels_count,
            max_boxes_count,
            risk_free_rate: risk_free_rate ?? 0,
            use_bar_magnifier,
            fill_orders_on_standard_ohlc,
            max_polylines_count,
        };

        // Remove undefined values
        Object.keys(options).forEach((key) => {
            if ((options as any)[key] === undefined) {
                delete (options as any)[key];
            }
        });

        context._strategyEngine.initialize(options);

        // Store strategy indicator info
        context.indicator = {
            title,
            shorttitle: shorttitle || title,
            overlay: overlay ?? true,
            precision,
            scale,
            isStrategy: true,
        };
    };
}
