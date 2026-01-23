// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.cancel() - Cancel a pending order by its ID
 *
 * @param id - A required parameter. The order identifier to cancel.
 */
export function cancel(context: any) {
    return (id: string) => {
        const engine = context._strategyEngine;
        if (!engine) {
            console.warn('Strategy not initialized. Call strategy() first.');
            return false;
        }

        return engine.cancelOrder(id);
    };
}
