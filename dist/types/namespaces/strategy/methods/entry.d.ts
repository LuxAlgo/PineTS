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
export declare function entry(context: any): (id: string, direction: "long" | "short", qty?: number, limit?: number, stop?: number, oca_name?: string, oca_type?: string, comment?: string, alert_message?: string, disable_alert?: boolean) => void;
