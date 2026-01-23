/**
 * Keltner Channels Width (KCW)
 *
 * Formula:
 * basis = ta.ema(src, length)
 * span = useTrueRange ? ta.tr : (high - low)
 * rangeEma = ta.ema(span, length)
 * kcw = ((basis + rangeEma * mult) - (basis - rangeEma * mult)) / basis
 *     = (2 * rangeEma * mult) / basis
 */
export declare function kcw(context: any): (source: any, _length: any, _mult: any, _useTrueRange?: any, _callId?: string) => any;
