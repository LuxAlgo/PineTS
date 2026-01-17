// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.closedtrades.commission() - Get commission of a closed trade
 *
 * @param trade_num - The trade number (0-based index)
 * @returns The total commission paid for the trade
 */
export function closedtrades_commission(context: any) {
    return (trade_num: number) => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        const trades = engine.getClosedTrades();
        if (trade_num < 0 || trade_num >= trades.length) {
            return 0;
        }
        return trades[trade_num].commission || 0;
    };
}
