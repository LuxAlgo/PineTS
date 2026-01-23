// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.avg_winning_trade - Average winning trade
 *
 * Returns the average profit of winning trades.
 */
export function avg_winning_trade(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        return engine.getAvgWinningTrade();
    };
}
