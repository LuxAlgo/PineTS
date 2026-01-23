/**
 * Requests financial data for a symbol.
 * In Pine Script, this returns income statements, balance sheets, and cash flow data.
 * In PineTS, this is a stub that returns NaN as financial data is not available.
 *
 * @param context - The execution context
 * @returns A function that returns NaN (data not available)
 */
export declare function financial(context: any): (symbol: any, financial_id: any, period?: any, gaps?: any, ignore_invalid_symbol?: any, currency?: any) => number;
