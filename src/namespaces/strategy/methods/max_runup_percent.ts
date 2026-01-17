// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.max_runup_percent - Maximum runup as percentage
 *
 * Returns the maximum runup as a percentage of initial capital.
 */
export function max_runup_percent(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        const initialCapital = engine.getInitialCapital();
        if (initialCapital === 0) return 0;
        return (engine.getMaxRunup() / initialCapital) * 100;
    };
}
