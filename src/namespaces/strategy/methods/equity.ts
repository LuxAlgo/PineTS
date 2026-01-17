// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.equity - Current equity value
 *
 * Returns the current equity (initial capital + realized profit/loss + unrealized profit/loss).
 */
export function equity(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 100000; // Default initial capital
        }
        return engine.getEquity();
    };
}
