// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.initial_capital - Initial capital for backtesting
 *
 * Returns the initial capital value set in the strategy() function.
 */
export function initial_capital(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 100000; // Default initial capital
        }
        return engine.getInitialCapital();
    };
}
