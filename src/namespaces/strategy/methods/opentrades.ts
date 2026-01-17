// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.opentrades - Number of open trades
 *
 * Returns the number of currently open (market) trades.
 */
export function opentrades(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        return engine.getOpenTradesCount();
    };
}
