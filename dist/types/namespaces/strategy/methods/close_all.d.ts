/**
 * strategy.close_all() - Exit from all market positions
 *
 * @param comment - An optional parameter. Additional notes on the order.
 * @param alert_message - An optional parameter. Alert message when order fills.
 * @param immediately - An optional parameter. If true, closes on the same bar.
 * @param disable_alert - An optional parameter. If true, disables alerts.
 */
export declare function close_all(context: any): (comment?: string, alert_message?: string, immediately?: boolean, disable_alert?: boolean) => void;
