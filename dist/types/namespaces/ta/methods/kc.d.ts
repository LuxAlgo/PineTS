/**
 * Keltner Channels (KC)
 *
 * Formula:
 * basis = ta.ema(src, length)
 * span = useTrueRange ? ta.tr : (high - low)
 * rangeEma = ta.ema(span, length)
 * upper = basis + rangeEma * mult
 * lower = basis - rangeEma * mult
 * Returns [basis, upper, lower]
 */
export declare function kc(context: any): (source: any, _length: any, _mult: any, _useTrueRange?: any, _callId?: string) => any[][];
