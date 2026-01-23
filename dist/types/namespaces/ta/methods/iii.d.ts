/**
 * Intraday Intensity Index (III)
 *
 * Formula:
 * (2 * close - high - low) / ((high - low) * volume)
 */
export declare function iii(context: any): (_callId?: string) => any;
