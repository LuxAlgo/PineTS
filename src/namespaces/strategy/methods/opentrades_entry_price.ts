// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.opentrades.entry_price() - Get entry price of an open trade
 *
 * @param trade_num - The trade number (0-based index)
 * @returns The entry price of the specified open trade
 */
export function opentrades_entry_price(context: any) {
    return (trade_num: number) => {
        const engine = context._strategyEngine;
        if (!engine) {
            return NaN;
        }
        const trades = engine.getOpenTrades();
        if (trade_num < 0 || trade_num >= trades.length) {
            return NaN;
        }
        return trades[trade_num].entry_price;
    };
}
