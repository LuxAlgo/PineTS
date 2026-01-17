/**
 * Requests dividend data for a symbol.
 * In Pine Script, this returns dividend amount when a dividend is paid.
 * In PineTS, this is a stub that returns NaN as dividend data is not available.
 *
 * @param context - The execution context
 * @returns A function that returns NaN (data not available)
 */
export declare function dividends(context: any): (ticker?: any, field?: any, gaps?: any, lookahead?: any, ignore_invalid_symbol?: any, currency?: any) => number;
