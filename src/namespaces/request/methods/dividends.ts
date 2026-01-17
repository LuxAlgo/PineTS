// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Requests dividend data for a symbol.
 * In Pine Script, this returns dividend amount when a dividend is paid.
 * In PineTS, this is a stub that returns NaN as dividend data is not available.
 *
 * @param context - The execution context
 * @returns A function that returns NaN (data not available)
 */
export function dividends(context: any) {
    return (
        ticker: any = null,
        field: any = 'gross',
        gaps: any = true,
        lookahead: any = false,
        ignore_invalid_symbol: any = false,
        currency: any = null
    ): number => {
        // Dividend data requires specialized data providers
        // Return NaN to indicate data is not available
        // This matches Pine Script behavior when data is unavailable
        return NaN;
    };
}
