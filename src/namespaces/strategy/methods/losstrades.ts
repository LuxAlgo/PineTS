// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.losstrades - Number of losing trades
 *
 * Returns the number of closed trades with negative profit.
 */
export function losstrades(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        return engine.getLossTrades();
    };
}
