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
export declare function exit(context: any): (id: string, from_entry?: string, qty?: number, qty_percent?: number, profit?: number, limit?: number, loss?: number, stop?: number, trail_price?: number, trail_points?: number, trail_offset?: number, oca_name?: string, comment?: string, comment_profit?: string, comment_loss?: string, comment_trailing?: string, alert_message?: string, alert_profit?: string, alert_loss?: string, alert_trailing?: string, disable_alert?: boolean) => void;
