// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.grossloss - Gross loss
 *
 * Returns the total loss from all losing trades (as a positive value).
 */
export function grossloss(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        return engine.getGrossLoss();
    };
}
