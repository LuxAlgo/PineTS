// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.closedtrades - Number of closed trades
 *
 * Returns the total number of closed trades.
 */
export function closedtrades(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        return engine.getClosedTradesCount();
    };
}
