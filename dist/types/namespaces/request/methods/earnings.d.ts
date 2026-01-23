/**
 * Requests earnings data for a symbol.
 * In Pine Script, this returns actual, estimate, and standardized EPS values.
 * In PineTS, this is a stub that returns NaN as earnings data is not available.
 *
 * @param context - The execution context
 * @returns A function that returns a tuple of NaN values
 */
export declare function earnings(context: any): (ticker?: any, field?: any, gaps?: any, lookahead?: any, ignore_invalid_symbol?: any, currency?: any) => number | [number, number, number];
