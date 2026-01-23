// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * strategy.close_all() - Exit from all market positions
 *
 * @param comment - An optional parameter. Additional notes on the order.
 * @param alert_message - An optional parameter. Alert message when order fills.
 * @param immediately - An optional parameter. If true, closes on the same bar.
 * @param disable_alert - An optional parameter. If true, disables alerts.
 */
export function close_all(context: any) {
    return (
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

        if (immediately) {
            // Close all immediately at current price
            engine.closeAllPositions('close_all');
        } else {
            // Determine exit direction
            const exitDirection: 'long' | 'short' = state.position_size > 0 ? 'short' : 'long';
            const totalQty = Math.abs(state.position_size);

            // Add market order to close all on next bar
            engine.addOrder({
                id: 'close_all',
                direction: exitDirection,
                qty: totalQty,
                comment: comment,
                alert_message: alert_message,
                isExit: true, // Mark as exit order to prevent opening new position
            });
        }
    };
}
