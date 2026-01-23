// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.closedtrades.exit_bar_index() - Get exit bar index of a closed trade
 *
 * @param trade_num - The trade number (0-based index)
 * @returns The bar index when the trade was exited
 */
export function closedtrades_exit_bar_index(context: any) {
    return (trade_num: number) => {
        const engine = context._strategyEngine;
        if (!engine) {
            return NaN;
        }
        const trades = engine.getClosedTrades();
        if (trade_num < 0 || trade_num >= trades.length) {
            return NaN;
        }
        return trades[trade_num].exit_bar_index || NaN;
    };
}
