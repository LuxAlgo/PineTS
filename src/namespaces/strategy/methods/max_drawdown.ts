// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.max_drawdown - Maximum drawdown
 *
 * Returns the maximum drawdown value from peak equity.
 */
export function max_drawdown(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        return engine.getMaxDrawdown();
    };
}
