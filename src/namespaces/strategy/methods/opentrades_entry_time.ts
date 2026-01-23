// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.opentrades.entry_time() - Get entry time of an open trade
 *
 * @param trade_num - The trade number (0-based index)
 * @returns The timestamp when the trade was entered
 */
export function opentrades_entry_time(context: any) {
    return (trade_num: number) => {
        const engine = context._strategyEngine;
        if (!engine) {
            return NaN;
        }
        const trades = engine.getOpenTrades();
        if (trade_num < 0 || trade_num >= trades.length) {
            return NaN;
        }
        return trades[trade_num].entry_time;
    };
}
