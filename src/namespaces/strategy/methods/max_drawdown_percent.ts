// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.max_drawdown_percent - Maximum drawdown as percentage
 *
 * Returns the maximum drawdown as a percentage of initial capital.
 */
export function max_drawdown_percent(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        const initialCapital = engine.getInitialCapital();
        if (initialCapital === 0) return 0;
        return (engine.getMaxDrawdown() / initialCapital) * 100;
    };
}
