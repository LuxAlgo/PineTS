// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.avg_trade - Average trade profit
 *
 * Returns the average profit/loss per trade.
 */
export function avg_trade(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        return engine.getAvgTrade();
    };
}
