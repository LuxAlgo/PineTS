// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * strategy.close() - Exit from a specific entry
 *
 * @param id - A required parameter. The identifier of the entry to close.
 * @param comment - An optional parameter. Additional notes on the order.
 * @param alert_message - An optional parameter. Alert message when order fills.
 * @param immediately - An optional parameter. If true, closes on the same bar.
 * @param disable_alert - An optional parameter. If true, disables alerts.
 */
export function close(context: any) {
    return (
        id: string,
        comment?: string,
        alert_message?: string,
        immediately?: boolean,
        disable_alert?: boolean
    ) => {
        const engine = context._strategyEngine;
        if (!engine) {
            console.warn('Strategy not initialized. Call strategy() first.');
            return;
        }

        const state = engine.getState();
        if (state.position_size === 0) {
            return; // No position to close
        }

        // Find trades matching the entry ID
        const matchingTrades = state.open_trades.filter((t: any) => t.entry_id === id);
        if (matchingTrades.length === 0) {
            return; // No matching entry
        }

        // Calculate total qty to close
        const qtyToClose = matchingTrades.reduce((sum: number, t: any) => sum + t.size, 0);

        // Determine exit direction
        const exitDirection: 'long' | 'short' = state.position_size > 0 ? 'short' : 'long';

        if (immediately) {
            // Close immediately at current price
            const currentPrice = context.data.close instanceof Series
                ? context.data.close.get(0)
                : context.data.close;
            const time = context.data.openTime instanceof Series
                ? context.data.openTime.get(0)
                : Date.now();

            engine.closePosition(currentPrice, context.idx, time, qtyToClose, `close_${id}`);
        } else {
            // Add market order to close on next bar
            engine.addOrder({
                id: `close_${id}`,
                direction: exitDirection,
                qty: qtyToClose,
                comment: comment,
                alert_message: alert_message,
                isExit: true, // Mark as exit order to prevent opening new position
            });
        }
    };
}
