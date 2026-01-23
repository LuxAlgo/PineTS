/**
 * SWMA - Symmetrically Weighted Moving Average
 *
 * Pine Script's ta.swma() uses a fixed period of 4 bars with symmetric weights.
 * The weights are applied symmetrically: the current and 3 previous bars.
 *
 * Weights for 4-bar period: [1, 2, 2, 1]
 * Formula: SWMA = (price[3]*1 + price[2]*2 + price[1]*2 + price[0]*1) / 6
 *
 * @param source - The data source (typically close price)
 *
 * Note: Unlike other moving averages, SWMA has a fixed period of 4 in Pine Script
 */
export declare function swma(context: any): (source: any, _callId?: string) => any;
