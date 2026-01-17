/**
 * Stochastic Oscillator (STOCH)
 *
 * The Stochastic Oscillator is a momentum indicator that shows the location of the close
 * relative to the high-low range over a set number of periods.
 *
 * Formula:
 * STOCH = 100 * (close - lowest(low, length)) / (highest(high, length) - lowest(low, length))
 *
 * @param source - Source series (typically close price)
 * @param high - Series of high prices
 * @param low - Series of low prices
 * @param length - Number of bars back (lookback period)
 * @returns Stochastic value (0-100)
 *
 * @remarks
 * - NaN values in the source series are ignored
 * - Returns NaN during initialization period (when not enough data)
 * - Returns NaN if highest equals lowest (to avoid division by zero)
 */
export declare function stoch(context: any): (source: any, high: any, low: any, _length: any, _callId?: string) => any;
