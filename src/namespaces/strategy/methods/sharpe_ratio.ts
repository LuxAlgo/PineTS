// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.sharpe_ratio - Sharpe ratio
 *
 * Returns the Sharpe ratio of the strategy.
 * Higher values indicate better risk-adjusted returns.
 */
export function sharpe_ratio(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        return engine.getSharpeRatio();
    };
}
