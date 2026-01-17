/**
 * True Strength Index (TSI)
 *
 * True strength index uses moving averages of the underlying momentum of a financial instrument.
 *
 * Formula:
 * pc = change(source)                    // Price change
 * double_smoothed_pc = ema(ema(pc, long_length), short_length)
 * double_smoothed_abs_pc = ema(ema(abs(pc), long_length), short_length)
 * tsi = double_smoothed_pc / double_smoothed_abs_pc
 *
 * @param source - Source series (typically close)
 * @param shortLength - Short EMA length
 * @param longLength - Long EMA length
 * @returns TSI value in range [-1, 1]
 */
export declare function tsi(context: any): (source: any, _shortLength: any, _longLength: any, _callId?: string) => any;
