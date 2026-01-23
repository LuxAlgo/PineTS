// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.grossprofit_percent - Gross profit as percentage
 *
 * Returns the total gross profit as a percentage of initial capital.
 */
export function grossprofit_percent(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        const initialCapital = engine.getInitialCapital();
        if (initialCapital === 0) return 0;
        return (engine.getGrossProfit() / initialCapital) * 100;
    };
}
