/**
 * Williams Accumulation/Distribution (WAD)
 *
 * Formula:
 * trueHigh = math.max(high, close[1])
 * trueLow = math.min(low, close[1])
 * mom = ta.change(close)
 * gain = (mom > 0) ? close - trueLow : (mom < 0) ? close - trueHigh : 0
 * ta.cum(gain)
 */
export declare function wad(context: any): (_callId?: string) => any;
