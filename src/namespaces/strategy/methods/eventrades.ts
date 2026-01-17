// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.eventrades - Number of even trades
 *
 * Returns the number of closed trades with zero profit.
 */
export function eventrades(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        return engine.getEventrades();
    };
}
