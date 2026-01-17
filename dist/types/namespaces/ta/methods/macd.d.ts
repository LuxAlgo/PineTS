/**
 * MACD - Moving Average Convergence Divergence
 *
 * MACD is a trend-following momentum indicator that shows the relationship between
 * two moving averages of a security's price.
 *
 * Formula:
 * - MACD Line = EMA(source, fastLength) - EMA(source, slowLength)
 * - Signal Line = EMA(MACD Line, signalLength)
 * - Histogram = MACD Line - Signal Line
 *
 * @param source - The data source (typically close price)
 * @param fastLength - The short period (default 12)
 * @param slowLength - The long period (default 26)
 * @param signalLength - The signal period (default 9)
 * @returns [macdLine, signalLine, histLine]
 */
export declare function macd(context: any): (source: any, _fastLength: any, _slowLength: any, _signalLength: any, _callId?: string) => any[][];
