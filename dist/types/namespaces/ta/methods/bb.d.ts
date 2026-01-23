/**
 * Bollinger Bands (BB)
 *
 * Bollinger Bands are volatility bands placed above and below a moving average.
 * Volatility is based on the standard deviation, which changes as volatility increases and decreases.
 *
 * Formula:
 * - Middle Band = SMA(source, length)
 * - Upper Band = Middle Band + (multiplier × Standard Deviation)
 * - Lower Band = Middle Band - (multiplier × Standard Deviation)
 *
 * @param source - The data source (typically close price)
 * @param length - The period for SMA and standard deviation (default 20)
 * @param mult - The multiplier for standard deviation (default 2)
 * @returns [upper, middle, lower]
 */
export declare function bb(context: any): (source: any, _length: any, _mult: any, _callId?: string) => any[][];
