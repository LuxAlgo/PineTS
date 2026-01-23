// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * strategy.entry() - Enter a position
 *
 * @param id - A required parameter. The order identifier.
 * @param direction - A required parameter. Market position direction: 'long' or 'short'
 * @param qty - An optional parameter. Number of contracts/shares/lots/units to trade.
 * @param limit - An optional parameter. Limit price of the order.
 * @param stop - An optional parameter. Stop price of the order.
 * @param oca_name - An optional parameter. Name of the OCA group.
 * @param oca_type - An optional parameter. Type of the OCA group.
 * @param comment - An optional parameter. Additional notes on the order.
 * @param alert_message - An optional parameter. Message to display when order fills.
 * @param disable_alert - An optional parameter. If true, disables alert for this order.
 */
export function entry(context: any) {
    return (
        id: string,
        direction: 'long' | 'short',
        qty?: number,
        limit?: number,
        stop?: number,
        oca_name?: string,
        oca_type?: string,
        comment?: string,
        alert_message?: string,
        disable_alert?: boolean
    ) => {
        const engine = context._strategyEngine;
        if (!engine) {
            console.warn('Strategy not initialized. Call strategy() first.');
            return;
        }

        // Get values from Series if needed
        const getVal = (v: any) => (v instanceof Series ? v.get(0) : v);

        const orderQty = qty !== undefined ? getVal(qty) : engine.getDefaultQty();
        const limitPrice = limit !== undefined ? getVal(limit) : undefined;
        const stopPrice = stop !== undefined ? getVal(stop) : undefined;

        // Add the order
        engine.addOrder({
            id: id || engine.generateOrderId(),
            direction: direction,
            qty: orderQty,
            limit: limitPrice,
            stop: stopPrice,
            oca_name: oca_name,
            oca_type: oca_type,
            comment: comment,
            alert_message: alert_message,
        });
    };
}
