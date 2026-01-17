/**
 * strategy.close() - Exit from a specific entry
 *
 * @param id - A required parameter. The identifier of the entry to close.
 * @param comment - An optional parameter. Additional notes on the order.
 * @param alert_message - An optional parameter. Alert message when order fills.
 * @param immediately - An optional parameter. If true, closes on the same bar.
 * @param disable_alert - An optional parameter. If true, disables alerts.
 */
export declare function close(context: any): (id: string, comment?: string, alert_message?: string, immediately?: boolean, disable_alert?: boolean) => void;
