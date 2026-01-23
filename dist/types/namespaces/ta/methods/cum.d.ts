/**
 * Cumulative Sum (CUM)
 *
 * Returns the cumulative sum of the source values from the first bar to the current bar.
 * The cumulative sum is the running total of all values.
 *
 * Formula:
 * - CUM[0] = source[0]
 * - CUM[n] = CUM[n-1] + source[n]
 *
 * @param source - The data source to accumulate
 * @returns The cumulative sum up to the current bar
 */
export declare function cum(context: any): (source: any, _callId?: string) => any;
