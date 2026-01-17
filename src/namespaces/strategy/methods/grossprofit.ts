// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.grossprofit - Gross profit
 *
 * Returns the total profit from all winning trades.
 */
export function grossprofit(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        return engine.getGrossProfit();
    };
}
