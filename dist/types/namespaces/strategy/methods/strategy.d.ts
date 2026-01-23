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
export declare function strategy(context: any): (title: string, shorttitle?: string, overlay?: boolean, format?: string, precision?: number, scale?: string, pyramiding?: number, calc_on_order_fills?: boolean, calc_on_every_tick?: boolean, max_bars_back?: number, backtest_fill_limits_assumption?: number, default_qty_type?: string, default_qty_value?: number, initial_capital?: number, currency?: string, slippage?: number, commission_type?: string, commission_value?: number, process_orders_on_close?: boolean, close_entries_rule?: string, margin_long?: number, margin_short?: number, explicit_plot_zorder?: boolean, max_lines_count?: number, max_labels_count?: number, max_boxes_count?: number, risk_free_rate?: number, use_bar_magnifier?: boolean, fill_orders_on_standard_ohlc?: boolean, max_polylines_count?: number) => void;
