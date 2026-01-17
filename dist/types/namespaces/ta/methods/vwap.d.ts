/**
 * VWAP - Volume Weighted Average Price
 *
 * VWAP calculates the average price weighted by volume for a trading session.
 * It resets at the start of each new session (typically daily).
 *
 * Formula: VWAP = Σ(Price × Volume) / Σ(Volume)
 *
 * @param source - The price source (typically close, hlc3, or ohlc4)
 *
 * Note: This implementation resets VWAP at the start of each trading session
 * based on detecting new trading days (when openTime changes to a new day).
 */
export declare function vwap(context: any): (source: any, _callId?: string) => any;
