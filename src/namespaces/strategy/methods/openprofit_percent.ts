// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.openprofit_percent - Open profit as percentage
 *
 * Returns the unrealized profit/loss of open positions as a percentage of initial capital.
 */
export function openprofit_percent(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        const initialCapital = engine.getInitialCapital();
        if (initialCapital === 0) return 0;
        return (engine.getOpenProfit() / initialCapital) * 100;
    };
}
