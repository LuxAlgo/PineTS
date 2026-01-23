/**
 * Pine Script ticker namespace implementation.
 * Provides functions for creating and modifying ticker identifiers.
 */
export declare class Ticker {
    private context;
    constructor(context: any);
    /**
     * Helper method to unwrap Series values for the transpiler.
     * @param source - The source value (can be a Series or scalar)
     * @param index - The index to get from the Series (default: 0)
     * @returns The unwrapped value
     */
    param(source: any, index?: number): any;
    /**
     * Creates a ticker identifier.
     * @param prefix - Exchange prefix (e.g., "NASDAQ", "NYSE", "BINANCE")
     * @param ticker - Ticker symbol (e.g., "AAPL", "BTCUSDT")
     * @param session - Session type (optional): session.regular, session.extended, session.premarket, session.postmarket
     * @param adjustment - Adjustment type (optional): adjustment.none, adjustment.splits, adjustment.dividends
     * @returns A ticker identifier string in the format "PREFIX:TICKER"
     */
    new(prefix: string, ticker: string, session?: string, adjustment?: string): string;
    /**
     * Creates a standard ticker identifier from a symbol.
     * Standardizes the symbol to ensure it's in the proper format.
     * @param symbol - The symbol to standardize (can be "AAPL" or "NASDAQ:AAPL")
     * @returns A standardized ticker identifier
     */
    standard(symbol: string): string;
    /**
     * Modifies a ticker identifier's session and/or adjustment settings.
     * @param tickerid - The original ticker identifier
     * @param session - New session type (optional)
     * @param adjustment - New adjustment type (optional)
     * @returns A modified ticker identifier
     */
    modify(tickerid: string, session?: string, adjustment?: string): string;
    /**
     * Creates a Heikin-Ashi ticker identifier.
     * When used with request.security(), returns Heikin-Ashi calculated values.
     * @param symbol - The symbol to convert to Heikin-Ashi (optional, defaults to current symbol)
     * @returns A Heikin-Ashi ticker identifier
     */
    heikinashi(symbol?: string): string;
    /**
     * Creates a Renko ticker identifier.
     * @param symbol - The symbol (optional, defaults to current symbol)
     * @param boxsize - The box size for Renko bars
     * @param style - The style: "Traditional" or "ATR"
     * @param request_wicks - Whether to include wicks
     * @param session - Session type (optional)
     * @param adjustment - Adjustment type (optional)
     * @returns A Renko ticker identifier
     */
    renko(symbol?: string, boxsize?: number, style?: string, request_wicks?: boolean, session?: string, adjustment?: string): string;
    /**
     * Creates a Line Break ticker identifier.
     * @param symbol - The symbol (optional, defaults to current symbol)
     * @param number_of_lines - Number of lines for reversal (default: 3)
     * @param session - Session type (optional)
     * @param adjustment - Adjustment type (optional)
     * @returns A Line Break ticker identifier
     */
    linebreak(symbol?: string, number_of_lines?: number, session?: string, adjustment?: string): string;
    /**
     * Creates a Kagi ticker identifier.
     * @param symbol - The symbol (optional, defaults to current symbol)
     * @param reversal - Reversal amount (number or percentage string like "3%")
     * @param session - Session type (optional)
     * @param adjustment - Adjustment type (optional)
     * @returns A Kagi ticker identifier
     */
    kagi(symbol?: string, reversal?: number | string, session?: string, adjustment?: string): string;
    /**
     * Creates a Point & Figure ticker identifier.
     * @param symbol - The symbol (optional, defaults to current symbol)
     * @param source - Source for calculations: "hl" or "close"
     * @param boxsize - The box size
     * @param reversal - Reversal amount (number of boxes)
     * @param session - Session type (optional)
     * @param adjustment - Adjustment type (optional)
     * @returns A Point & Figure ticker identifier
     */
    pointfigure(symbol?: string, source?: string, boxsize?: number, reversal?: number, session?: string, adjustment?: string): string;
    /**
     * Creates a ticker identifier that inherits session and other properties from another ticker.
     * @param from_tickerid - The ticker to inherit properties from
     * @param symbol - The symbol for the new ticker (optional)
     * @returns A ticker identifier with inherited properties
     */
    inherit(from_tickerid: string, symbol?: string): string;
    /**
     * Helper to get the current ticker ID from context.
     * @private
     */
    private _getCurrentTickerId;
}
