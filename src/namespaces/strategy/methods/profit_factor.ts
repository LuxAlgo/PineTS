// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.profit_factor - Profit factor
 *
 * Returns the ratio of gross profit to gross loss.
 * A profit factor greater than 1 indicates a profitable strategy.
 */
export function profit_factor(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        return engine.getProfitFactor();
    };
}
