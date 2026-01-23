// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.avg_trade_percent - Average trade profit as percentage
 *
 * Returns the average profit/loss per trade as a percentage of initial capital.
 */
export function avg_trade_percent(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        const initialCapital = engine.getInitialCapital();
        if (initialCapital === 0) return 0;
        return (engine.getAvgTrade() / initialCapital) * 100;
    };
}
