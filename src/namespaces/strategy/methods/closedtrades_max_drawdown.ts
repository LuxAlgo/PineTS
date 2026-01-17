// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.closedtrades.max_drawdown() - Get maximum drawdown of a closed trade
 *
 * @param trade_num - The trade number (0-based index)
 * @returns The maximum loss seen during the trade
 */
export function closedtrades_max_drawdown(context: any) {
    return (trade_num: number) => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        const trades = engine.getClosedTrades();
        if (trade_num < 0 || trade_num >= trades.length) {
            return 0;
        }
        return trades[trade_num].max_drawdown || 0;
    };
}
