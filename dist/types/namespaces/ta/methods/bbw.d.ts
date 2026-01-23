/**
 * Bollinger Bands Width (BBW)
 *
 * Formula:
 * basis = ta.sma(source, length)
 * dev = mult * ta.stdev(source, length)
 * bbw = (((basis + dev) - (basis - dev)) / basis) * 100
 */
export declare function bbw(context: any): (source: any, _length: any, _mult: any, _callId?: string) => any;
