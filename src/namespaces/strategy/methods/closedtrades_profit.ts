// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.closedtrades.profit() - Get profit of a closed trade
 *
 * @param trade_num - The trade number (0-based index)
 * @returns The realized profit/loss of the trade
 */
export function closedtrades_profit(context: any) {
    return (trade_num: number) => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        const trades = engine.getClosedTrades();
        if (trade_num < 0 || trade_num >= trades.length) {
            return 0;
        }
        return trades[trade_num].profit || 0;
    };
}
