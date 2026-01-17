// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.max_runup - Maximum runup
 *
 * Returns the maximum runup value from trough equity.
 */
export function max_runup(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        return engine.getMaxRunup();
    };
}
