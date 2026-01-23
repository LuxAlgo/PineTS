// SPDX-License-Identifier: AGPL-3.0-only

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
export function economic(context: any) {
    return (
        country_code: string,
        field: string,
        gaps: boolean = true,
        ignore_invalid_symbol: boolean = false
    ): number => {
        // Economic data requires specialized data providers
        // Return NaN to indicate data is not available
        // This matches Pine Script behavior when data is unavailable
        return NaN;
    };
}
