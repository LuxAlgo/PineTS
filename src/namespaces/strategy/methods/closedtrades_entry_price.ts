// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.closedtrades.entry_price() - Get entry price of a closed trade
 *
 * @param trade_num - The trade number (0-based index)
 * @returns The entry price of the specified closed trade
 */
export function closedtrades_entry_price(context: any) {
    return (trade_num: number) => {
        const engine = context._strategyEngine;
        if (!engine) {
            return NaN;
        }
        const trades = engine.getClosedTrades();
        if (trade_num < 0 || trade_num >= trades.length) {
            return NaN;
        }
        return trades[trade_num].entry_price;
    };
}
