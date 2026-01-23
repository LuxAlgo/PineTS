// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Requests Quandl data.
 * Note: This function is deprecated in Pine Script.
 * In PineTS, this is a stub that returns NaN.
 *
 * @param context - The execution context
 * @returns A function that returns NaN (data not available)
 */
export function quandl(context: any) {
    return (
        ticker: any,
        gaps: any = true,
        index: any = 0,
        ignore_invalid_symbol: any = false
    ): number => {
        // Quandl data is deprecated and not available
        // Return NaN to indicate data is not available
        console.warn('request.quandl() is deprecated. Use request.security() instead.');
        return NaN;
    };
}
