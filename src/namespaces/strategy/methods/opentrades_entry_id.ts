// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.opentrades.entry_id() - Get entry ID of an open trade
 *
 * @param trade_num - The trade number (0-based index)
 * @returns The entry order ID of the trade
 */
export function opentrades_entry_id(context: any) {
    return (trade_num: number) => {
        const engine = context._strategyEngine;
        if (!engine) {
            return '';
        }
        const trades = engine.getOpenTrades();
        if (trade_num < 0 || trade_num >= trades.length) {
            return '';
        }
        return trades[trade_num].entry_id;
    };
}
