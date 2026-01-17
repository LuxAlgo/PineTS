// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.grossloss_percent - Gross loss as percentage
 *
 * Returns the total gross loss as a percentage of initial capital.
 */
export function grossloss_percent(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        const initialCapital = engine.getInitialCapital();
        if (initialCapital === 0) return 0;
        return (engine.getGrossLoss() / initialCapital) * 100;
    };
}
