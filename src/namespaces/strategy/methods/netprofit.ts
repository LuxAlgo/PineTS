// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.netprofit - Net profit
 *
 * Returns the total net profit from all closed trades.
 */
export function netprofit(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        return engine.getNetProfit();
    };
}
