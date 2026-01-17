// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Requests stock split data for a symbol.
 * In Pine Script, this returns the split ratio when a split occurs.
 * In PineTS, this is a stub that returns NaN as split data is not available.
 *
 * @param context - The execution context
 * @returns A function that returns NaN (data not available)
 */
export function splits(context: any) {
    return (
        ticker: any = null,
        field: any = 'numerator',
        gaps: any = true,
        lookahead: any = false,
        ignore_invalid_symbol: any = false
    ): number | [number, number] => {
        // Split data requires specialized data providers
        // Return NaN to indicate data is not available

        // If requesting a specific field, return single NaN
        if (field === 'numerator' || field === 'denominator') {
            return NaN;
        }

        // Otherwise return tuple of [numerator, denominator]
        return [NaN, NaN];
    };
}
