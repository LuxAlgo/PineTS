// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.avg_losing_trade_percent - Average losing trade as percentage
 *
 * Returns the average loss of losing trades as a percentage of initial capital.
 */
export function avg_losing_trade_percent(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        const initialCapital = engine.getInitialCapital();
        if (initialCapital === 0) return 0;
        return (engine.getAvgLosingTrade() / initialCapital) * 100;
    };
}
