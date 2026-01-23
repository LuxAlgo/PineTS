// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../Series';

/**
 * Pine Script ticker namespace implementation.
 * Provides functions for creating and modifying ticker identifiers.
 */
export class Ticker {
    constructor(private context: any) {}

    /**
     * Helper method to unwrap Series values for the transpiler.
     * @param source - The source value (can be a Series or scalar)
     * @param index - The index to get from the Series (default: 0)
     * @returns The unwrapped value
     */
    param(source: any, index: number = 0): any {
        return Series.from(source).get(index);
    }

    /**
     * Creates a ticker identifier.
     * @param prefix - Exchange prefix (e.g., "NASDAQ", "NYSE", "BINANCE")
     * @param ticker - Ticker symbol (e.g., "AAPL", "BTCUSDT")
     * @param session - Session type (optional): session.regular, session.extended, session.premarket, session.postmarket
     * @param adjustment - Adjustment type (optional): adjustment.none, adjustment.splits, adjustment.dividends
     * @returns A ticker identifier string in the format "PREFIX:TICKER"
     */
    new(prefix: string, ticker: string, session?: string, adjustment?: string): string {
        // Basic format: PREFIX:TICKER
        let tickerId = `${prefix}:${ticker}`;

        // Store session and adjustment info in the ticker string if needed
        // Pine Script uses these when making requests, but the base format is PREFIX:TICKER
        if (session || adjustment) {
            // These would be used by request.security() to modify the request
            // For now, we just return the base ticker ID
        }

        return tickerId;
    }

    /**
     * Creates a standard ticker identifier from a symbol.
     * Standardizes the symbol to ensure it's in the proper format.
     * @param symbol - The symbol to standardize (can be "AAPL" or "NASDAQ:AAPL")
     * @returns A standardized ticker identifier
     */
    standard(symbol: string): string {
        // If already in PREFIX:TICKER format, return as-is
        if (symbol.includes(':')) {
            return symbol;
        }

        // Try to get the prefix from the current context
        const syminfo = this.context.pine?.syminfo;
        if (syminfo && syminfo.prefix) {
            return `${syminfo.prefix}:${symbol}`;
        }

        // Default: return the symbol as-is
        return symbol;
    }

    /**
     * Modifies a ticker identifier's session and/or adjustment settings.
     * @param tickerid - The original ticker identifier
     * @param session - New session type (optional)
     * @param adjustment - New adjustment type (optional)
     * @returns A modified ticker identifier
     */
    modify(tickerid: string, session?: string, adjustment?: string): string {
        // In Pine Script, modify creates a new ticker with different session/adjustment settings
        // For PineTS, we'll return the ticker with metadata that request.security can use
        // For now, we just return the base ticker
        return tickerid;
    }

    /**
     * Creates a Heikin-Ashi ticker identifier.
     * When used with request.security(), returns Heikin-Ashi calculated values.
     * @param symbol - The symbol to convert to Heikin-Ashi (optional, defaults to current symbol)
     * @returns A Heikin-Ashi ticker identifier
     */
    heikinashi(symbol?: string): string {
        const baseSymbol = symbol || this._getCurrentTickerId();
        // Mark as Heikin-Ashi for request.security() to handle
        return `${baseSymbol}#HA`;
    }

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
    renko(
        symbol?: string,
        boxsize: number = 1,
        style: string = 'Traditional',
        request_wicks: boolean = false,
        session?: string,
        adjustment?: string
    ): string {
        const baseSymbol = symbol || this._getCurrentTickerId();
        // Mark as Renko for request.security() to handle
        return `${baseSymbol}#RENKO_${boxsize}_${style}`;
    }

    /**
     * Creates a Line Break ticker identifier.
     * @param symbol - The symbol (optional, defaults to current symbol)
     * @param number_of_lines - Number of lines for reversal (default: 3)
     * @param session - Session type (optional)
     * @param adjustment - Adjustment type (optional)
     * @returns A Line Break ticker identifier
     */
    linebreak(symbol?: string, number_of_lines: number = 3, session?: string, adjustment?: string): string {
        const baseSymbol = symbol || this._getCurrentTickerId();
        // Mark as Line Break for request.security() to handle
        return `${baseSymbol}#LB_${number_of_lines}`;
    }

    /**
     * Creates a Kagi ticker identifier.
     * @param symbol - The symbol (optional, defaults to current symbol)
     * @param reversal - Reversal amount (number or percentage string like "3%")
     * @param session - Session type (optional)
     * @param adjustment - Adjustment type (optional)
     * @returns A Kagi ticker identifier
     */
    kagi(symbol?: string, reversal: number | string = 1, session?: string, adjustment?: string): string {
        const baseSymbol = symbol || this._getCurrentTickerId();
        // Mark as Kagi for request.security() to handle
        return `${baseSymbol}#KAGI_${reversal}`;
    }

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
    pointfigure(
        symbol?: string,
        source: string = 'hl',
        boxsize: number = 1,
        reversal: number = 3,
        session?: string,
        adjustment?: string
    ): string {
        const baseSymbol = symbol || this._getCurrentTickerId();
        // Mark as Point & Figure for request.security() to handle
        return `${baseSymbol}#PF_${source}_${boxsize}_${reversal}`;
    }

    /**
     * Creates a ticker identifier that inherits session and other properties from another ticker.
     * @param from_tickerid - The ticker to inherit properties from
     * @param symbol - The symbol for the new ticker (optional)
     * @returns A ticker identifier with inherited properties
     */
    inherit(from_tickerid: string, symbol?: string): string {
        // If no symbol provided, just return the from_tickerid
        if (!symbol) {
            return from_tickerid;
        }

        // Extract prefix from from_tickerid if it has one
        if (from_tickerid.includes(':')) {
            const prefix = from_tickerid.split(':')[0];
            return `${prefix}:${symbol}`;
        }

        return symbol;
    }

    /**
     * Helper to get the current ticker ID from context.
     * @private
     */
    private _getCurrentTickerId(): string {
        const syminfo = this.context.pine?.syminfo;
        if (syminfo) {
            return syminfo.tickerid || syminfo.ticker || '';
        }
        return this.context.tickerId || '';
    }
}
