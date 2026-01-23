/**
 * SuperTrend Indicator
 *
 * The Supertrend is a trend following indicator based on ATR.
 *
 * Pine Script Formula:
 * src = hl2
 * atr = ta.atr(atrPeriod)
 * upperBand = src + factor * atr
 * lowerBand = src - factor * atr
 * prevLowerBand = nz(lowerBand[1])
 * prevUpperBand = nz(upperBand[1])
 *
 * lowerBand := lowerBand > prevLowerBand or close[1] < prevLowerBand ? lowerBand : prevLowerBand
 * upperBand := upperBand < prevUpperBand or close[1] > prevUpperBand ? upperBand : prevUpperBand
 *
 * direction: 1 (down/bearish), -1 (up/bullish)
 * superTrend := direction == -1 ? lowerBand : upperBand
 *
 * @param factor - The multiplier by which the ATR will get multiplied
 * @param atrPeriod - Length of ATR
 * @returns Tuple [supertrend, direction] where direction is 1 (down) or -1 (up)
 */
export declare function supertrend(context: any): (_factor: any, _atrPeriod: any, _callId?: string) => any[][];
