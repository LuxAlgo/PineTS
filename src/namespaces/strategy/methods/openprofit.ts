// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.openprofit - Unrealized profit/loss
 *
 * Returns the current unrealized profit or loss for all open trades.
 */
export function openprofit(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        return engine.getOpenProfit();
    };
}
