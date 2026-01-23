// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.cancel_all() - Cancel all pending orders
 */
export function cancel_all(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            console.warn('Strategy not initialized. Call strategy() first.');
            return;
        }

        engine.cancelAllOrders();
    };
}
