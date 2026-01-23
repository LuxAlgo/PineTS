/**
 * Provides the daily exchange rate between two currency pairs.
 * In Pine Script, this fetches actual forex data.
 * In PineTS, we provide a simplified implementation.
 *
 * @param context - The execution context
 * @returns A function that returns currency exchange rates
 */
export declare function currency_rate(context: any): (from: any, to: any, ignore_invalid_currency?: boolean) => number;
