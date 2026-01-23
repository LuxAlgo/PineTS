// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.wintrades - Number of winning trades
 *
 * Returns the number of closed trades with positive profit.
 */
export function wintrades(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        return engine.getWinTrades();
    };
}
