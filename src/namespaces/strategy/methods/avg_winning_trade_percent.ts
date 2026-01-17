// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.avg_winning_trade_percent - Average winning trade as percentage
 *
 * Returns the average profit of winning trades as a percentage of initial capital.
 */
export function avg_winning_trade_percent(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        const initialCapital = engine.getInitialCapital();
        if (initialCapital === 0) return 0;
        return (engine.getAvgWinningTrade() / initialCapital) * 100;
    };
}
