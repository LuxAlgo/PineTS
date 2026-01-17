// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Requests financial data for a symbol.
 * In Pine Script, this returns income statements, balance sheets, and cash flow data.
 * In PineTS, this is a stub that returns NaN as financial data is not available.
 *
 * @param context - The execution context
 * @returns A function that returns NaN (data not available)
 */
export function financial(context: any) {
    return (
        symbol: any,
        financial_id: any,
        period: any = 'FQ',
        gaps: any = true,
        ignore_invalid_symbol: any = false,
        currency: any = null
    ): number => {
        // Financial data requires specialized data providers
        // Return NaN to indicate data is not available
        // This matches Pine Script behavior when data is unavailable
        return NaN;
    };
}
