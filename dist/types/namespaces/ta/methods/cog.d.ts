/**
 * Center of Gravity (COG)
 *
 * The cog (center of gravity) is an indicator based on statistics and the Fibonacci golden ratio.
 *
 * Pine Script Formula:
 * sum = sum(source, length)
 * num = 0.0
 * for i = 0 to length - 1
 *     price = source[i]
 *     num = num + price * (i + 1)
 * cog = -num / sum
 *
 * @param source - Source series (typically close)
 * @param length - Number of bars (lookback period)
 * @returns Center of Gravity value
 */
export declare function cog(context: any): (source: any, _length: any, _callId?: string) => any;
