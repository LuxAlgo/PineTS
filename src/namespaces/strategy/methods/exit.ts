// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * strategy.exit() - Exit from a position
 *
 * @param id - A required parameter. The order identifier.
 * @param from_entry - An optional parameter. The identifier of the entry order to exit from.
 * @param qty - An optional parameter. Number of contracts/shares/lots/units to exit.
 * @param qty_percent - An optional parameter. Percent of position to exit (0-100).
 * @param profit - An optional parameter. Profit target in price units.
 * @param limit - An optional parameter. Limit price for take profit.
 * @param loss - An optional parameter. Stop loss in price units.
 * @param stop - An optional parameter. Stop price for stop loss.
 * @param trail_price - An optional parameter. Trailing stop activation price.
 * @param trail_points - An optional parameter. Trailing stop distance in points.
 * @param trail_offset - An optional parameter. Trailing stop offset in ticks.
 * @param oca_name - An optional parameter. Name of the OCA group.
 * @param comment - An optional parameter. Additional notes on the order.
 * @param comment_profit - An optional parameter. Comment for profit target.
 * @param comment_loss - An optional parameter. Comment for stop loss.
 * @param comment_trailing - An optional parameter. Comment for trailing stop.
 * @param alert_message - An optional parameter. Alert message when order fills.
 * @param alert_profit - An optional parameter. Alert for profit target.
 * @param alert_loss - An optional parameter. Alert for stop loss.
 * @param alert_trailing - An optional parameter. Alert for trailing stop.
 * @param disable_alert - An optional parameter. If true, disables alerts.
 */
export function exit(context: any) {
    return (
        id: string,
        from_entry?: string,
        qty?: number,
        qty_percent?: number,
        profit?: number,
        limit?: number,
        loss?: number,
        stop?: number,
        trail_price?: number,
        trail_points?: number,
        trail_offset?: number,
        oca_name?: string,
        comment?: string,
        comment_profit?: string,
        comment_loss?: string,
        comment_trailing?: string,
        alert_message?: string,
        alert_profit?: string,
        alert_loss?: string,
        alert_trailing?: string,
        disable_alert?: boolean
    ) => {
        const engine = context._strategyEngine;
        if (!engine) {
            console.warn('Strategy not initialized. Call strategy() first.');
            return;
        }

        const state = engine.getState();
        if (state.position_size === 0) {
            return; // No position to exit
        }

        // Get values from Series if needed
        const getVal = (v: any) => (v instanceof Series ? v.get(0) : v);

        // Determine quantity to exit
        let exitQty: number;
        if (qty !== undefined) {
            exitQty = getVal(qty);
        } else if (qty_percent !== undefined) {
            exitQty = Math.abs(state.position_size) * (getVal(qty_percent) / 100);
        } else {
            exitQty = Math.abs(state.position_size);
        }

        // Determine exit direction (opposite of position)
        const exitDirection: 'long' | 'short' = state.position_size > 0 ? 'short' : 'long';
        const entryPrice = state.position_avg_price;

        // Calculate limit/stop prices from profit/loss targets
        let limitPrice = limit !== undefined ? getVal(limit) : undefined;
        let stopPrice = stop !== undefined ? getVal(stop) : undefined;

        if (profit !== undefined && limitPrice === undefined) {
            const profitVal = getVal(profit);
            if (state.position_size > 0) {
                limitPrice = entryPrice + profitVal;
            } else {
                limitPrice = entryPrice - profitVal;
            }
        }

        if (loss !== undefined && stopPrice === undefined) {
            const lossVal = getVal(loss);
            if (state.position_size > 0) {
                stopPrice = entryPrice - lossVal;
            } else {
                stopPrice = entryPrice + lossVal;
            }
        }

        // Create OCA group for take profit and stop loss
        const ocaGroupName = oca_name || `exit_${id}_${context.idx}`;

        // Add take profit order if limit is set
        if (limitPrice !== undefined) {
            engine.addOrder({
                id: `${id}_tp`,
                direction: exitDirection,
                qty: exitQty,
                limit: limitPrice,
                oca_name: ocaGroupName,
                oca_type: 'cancel',
                comment: comment_profit || comment,
                alert_message: alert_profit || alert_message,
                isExit: true,
            });
        }

        // Add stop loss order if stop is set
        if (stopPrice !== undefined) {
            engine.addOrder({
                id: `${id}_sl`,
                direction: exitDirection,
                qty: exitQty,
                stop: stopPrice,
                oca_name: ocaGroupName,
                oca_type: 'cancel',
                comment: comment_loss || comment,
                alert_message: alert_loss || alert_message,
                isExit: true,
            });
        }

        // Handle trailing stop
        if (trail_points !== undefined || trail_price !== undefined) {
            const currentPrice = context.data.close instanceof Series
                ? context.data.close.get(0)
                : context.data.close;

            let trailStop: number;
            if (trail_points !== undefined) {
                const points = getVal(trail_points);
                if (state.position_size > 0) {
                    trailStop = currentPrice - points;
                } else {
                    trailStop = currentPrice + points;
                }
            } else {
                trailStop = getVal(trail_price);
            }

            engine.addOrder({
                id: `${id}_trail`,
                direction: exitDirection,
                qty: exitQty,
                stop: trailStop,
                oca_name: ocaGroupName,
                oca_type: 'cancel',
                comment: comment_trailing || comment,
                alert_message: alert_trailing || alert_message,
                isExit: true,
            });
        }

        // If no specific exit conditions, create market exit
        if (limitPrice === undefined && stopPrice === undefined && trail_points === undefined && trail_price === undefined) {
            engine.addOrder({
                id: id,
                direction: exitDirection,
                qty: exitQty,
                comment: comment,
                alert_message: alert_message,
                isExit: true,
            });
        }
    };
}
