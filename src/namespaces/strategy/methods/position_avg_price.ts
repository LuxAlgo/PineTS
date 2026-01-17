// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.position_avg_price - Average entry price of current position
 *
 * Returns the average entry price for the open position.
 * Returns 0 if there is no open position.
 */
export function position_avg_price(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        return engine.getPositionAvgPrice();
    };
}
