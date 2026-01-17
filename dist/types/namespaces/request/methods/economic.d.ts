/**
 * Requests economic data for a country/region.
 * In Pine Script, this returns economic indicators like GDP, inflation, etc.
 * In PineTS, this is a stub that returns NaN as economic data is not available.
 *
 * @param context - The execution context
 * @returns A function that returns NaN (data not available)
 *
 * @example
 * // In Pine Script:
 * // gdp = request.economic("US", "GDP")
 * // unemployment = request.economic("US", "URATE")
 */
export declare function economic(context: any): (country_code: string, field: string, gaps?: boolean, ignore_invalid_symbol?: boolean) => number;
