// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.netprofit_percent - Net profit as percentage
 *
 * Returns the total net profit as a percentage of initial capital.
 */
export function netprofit_percent(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        const initialCapital = engine.getInitialCapital();
        if (initialCapital === 0) return 0;
        return (engine.getNetProfit() / initialCapital) * 100;
    };
}
