/**
 * Williams %R (WPR)
 *
 * The oscillator shows the current closing price in relation to the high and low
 * of the past 'length' bars.
 *
 * Formula:
 * %R = (Highest High - Close) / (Highest High - Lowest Low) * -100
 *
 * Note: Williams %R produces values between -100 and 0
 * - Values near -100 indicate oversold conditions
 * - Values near 0 indicate overbought conditions
 *
 * @param length - Number of bars (lookback period)
 * @returns Williams %R value (-100 to 0)
 */
export declare function wpr(context: any): (_length: any, _callId?: string) => any;
