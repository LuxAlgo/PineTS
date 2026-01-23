// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.win_rate - Win rate percentage
 *
 * Returns the percentage of winning trades.
 */
export function win_rate(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        return engine.getWinRate();
    };
}
