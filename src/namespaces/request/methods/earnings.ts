// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Requests earnings data for a symbol.
 * In Pine Script, this returns actual, estimate, and standardized EPS values.
 * In PineTS, this is a stub that returns NaN as earnings data is not available.
 *
 * @param context - The execution context
 * @returns A function that returns a tuple of NaN values
 */
export function earnings(context: any) {
    return (
        ticker: any = null,
        field: any = 'actual',
        gaps: any = true,
        lookahead: any = false,
        ignore_invalid_symbol: any = false,
        currency: any = null
    ): number | [number, number, number] => {
        // Earnings data requires specialized data providers
        // Return NaN to indicate data is not available

        // If requesting a specific field, return single NaN
        if (field === 'actual' || field === 'estimate' || field === 'standardized') {
            return NaN;
        }

        // Otherwise return tuple of [actual, estimate, standardized]
        return [NaN, NaN, NaN];
    };
}
