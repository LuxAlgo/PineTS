/**
 * Money Flow Index (MFI)
 *
 * MFI is a momentum indicator that uses price and volume to identify overbought or oversold conditions.
 *
 * Pine Script Formula:
 * upper = sum(volume * (change(src) <= 0 ? 0 : src), length)
 * lower = sum(volume * (change(src) >= 0 ? 0 : src), length)
 * mfi = 100.0 - (100.0 / (1.0 + upper / lower))
 *
 * @param source - Source series (typically hlc3)
 * @param length - Number of bars back (lookback period)
 * @returns MFI value (0-100)
 */
export declare function mfi(context: any): (source: any, _length: any, _callId?: string) => any;
