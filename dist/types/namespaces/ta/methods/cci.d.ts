/**
 * Commodity Channel Index (CCI)
 *
 * CCI measures the deviation of the price from its average price.
 * It's used to identify cyclical trends and overbought/oversold conditions.
 *
 * Formula:
 * - Typical Price (TP) = (high + low + close) / 3
 * - CCI = (TP - SMA(TP, length)) / (0.015 × Mean Deviation)
 * - Mean Deviation = Average of |TP - SMA(TP)| over length periods
 *
 * @param source - Source series (typically close price, but can be any price)
 * @param length - Number of bars back (lookback period)
 * @returns CCI value
 *
 * @remarks
 * - Returns NaN during initialization period (when not enough data)
 * - The constant 0.015 ensures approximately 70-80% of values fall between -100 and +100
 */
export declare function cci(context: any): (source: any, _length: any, _callId?: string) => any;
