/**
 * Falling Detection
 *
 * Tests if the source series is now falling for length bars long.
 * Returns true if the series has been consecutively falling for length bars.
 *
 * Formula:
 * For length=2: source[0] < source[1] AND source[1] < source[2]
 * For length=n: source[i] < source[i+1] for all i from 0 to n-1
 *
 * @param source - Series of values to process
 * @param length - Number of bars to check (lookback period)
 * @returns true if consecutively falling for length bars, false otherwise
 */
export declare function falling(context: any): (source: any, _length: any, _callId?: string) => boolean;
