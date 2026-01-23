/**
 * Requests stock split data for a symbol.
 * In Pine Script, this returns the split ratio when a split occurs.
 * In PineTS, this is a stub that returns NaN as split data is not available.
 *
 * @param context - The execution context
 * @returns A function that returns NaN (data not available)
 */
export declare function splits(context: any): (ticker?: any, field?: any, gaps?: any, lookahead?: any, ignore_invalid_symbol?: any) => number | [number, number];
