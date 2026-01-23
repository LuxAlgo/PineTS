// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.avg_losing_trade - Average losing trade
 *
 * Returns the average loss of losing trades.
 */
export function avg_losing_trade(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        return engine.getAvgLosingTrade();
    };
}
