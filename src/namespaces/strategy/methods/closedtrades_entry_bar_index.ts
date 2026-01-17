// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.closedtrades.entry_bar_index() - Get entry bar index of a closed trade
 *
 * @param trade_num - The trade number (0-based index)
 * @returns The bar index when the trade was entered
 */
export function closedtrades_entry_bar_index(context: any) {
    return (trade_num: number) => {
        const engine = context._strategyEngine;
        if (!engine) {
            return NaN;
        }
        const trades = engine.getClosedTrades();
        if (trade_num < 0 || trade_num >= trades.length) {
            return NaN;
        }
        return trades[trade_num].entry_bar_index;
    };
}
