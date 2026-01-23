// SPDX-License-Identifier: AGPL-3.0-only

import { ISymbolInfo } from '../marketData/IProvider';

/**
 * Interface for the callable prefix/ticker functions that also act as string properties
 * When called: syminfo.prefix("NASDAQ:AAPL") returns "NASDAQ"
 * When accessed as property: syminfo.prefix returns the current symbol's prefix
 */
interface SyminfoCallable {
    (tickerid?: string): string;
    toString(): string;
    valueOf(): string;
}

/**
 * Creates a callable function that also acts as a string-like property
 */
function createCallableProperty(defaultValue: string, parser: (tickerid: string) => string): SyminfoCallable {
    const fn = ((tickerid?: string) => {
        if (tickerid !== undefined) {
            return parser(tickerid);
        }
        return defaultValue;
    }) as SyminfoCallable;

    // Make it behave like a string when coerced
    fn.toString = () => defaultValue;
    fn.valueOf = () => defaultValue;

    return fn;
}

/**
 * Syminfo namespace - provides symbol information
 *
 * Supports both property access and callable functions:
 * - syminfo.ticker - returns current symbol's ticker
 * - syminfo.ticker("NASDAQ:AAPL") - extracts "AAPL" from the tickerid
 * - syminfo.prefix - returns current symbol's prefix/exchange
 * - syminfo.prefix("NASDAQ:AAPL") - extracts "NASDAQ" from the tickerid
 */
export class Syminfo {
    private _info: ISymbolInfo | null = null;

    constructor(private context: any) {}

    /**
     * Sets the symbol info from the provider
     */
    setSymbolInfo(info: ISymbolInfo) {
        this._info = info;
    }

    // ============================================================
    // Callable Functions (also work as properties)
    // ============================================================

    /**
     * Returns the prefix (exchange) of the symbol
     * - As property: returns current symbol's prefix
     * - As function: syminfo.prefix("EXCHANGE:SYMBOL") extracts "EXCHANGE"
     */
    get prefix(): SyminfoCallable {
        const value = this._info?.prefix || '';
        return createCallableProperty(value, (tickerid: string) => {
            const parts = tickerid.split(':');
            return parts.length > 1 ? parts[0] : '';
        });
    }

    /**
     * Returns the ticker of the symbol (without exchange prefix)
     * - As property: returns current symbol's ticker
     * - As function: syminfo.ticker("EXCHANGE:SYMBOL") extracts "SYMBOL"
     */
    get ticker(): SyminfoCallable {
        const value = this._info?.ticker || '';
        return createCallableProperty(value, (tickerid: string) => {
            const colonIndex = tickerid.indexOf(':');
            return colonIndex > -1 ? tickerid.slice(colonIndex + 1) : tickerid;
        });
    }

    // ============================================================
    // Symbol Identification
    // ============================================================

    get current_contract(): string {
        return this._info?.current_contract || '';
    }

    get description(): string {
        return this._info?.description || '';
    }

    get isin(): string {
        return this._info?.isin || '';
    }

    get main_tickerid(): string {
        return this._info?.main_tickerid || '';
    }

    get root(): string {
        return this._info?.root || '';
    }

    get tickerid(): string {
        return this._info?.tickerid || '';
    }

    get type(): string {
        return this._info?.type || '';
    }

    // ============================================================
    // Currency & Location
    // ============================================================

    get basecurrency(): string {
        return this._info?.basecurrency || '';
    }

    get country(): string {
        return this._info?.country || '';
    }

    get currency(): string {
        return this._info?.currency || '';
    }

    get timezone(): string {
        return this._info?.timezone || 'Etc/UTC';
    }

    // ============================================================
    // Company Data
    // ============================================================

    get employees(): number {
        return this._info?.employees || 0;
    }

    get industry(): string {
        return this._info?.industry || '';
    }

    get sector(): string {
        return this._info?.sector || '';
    }

    get shareholders(): number {
        return this._info?.shareholders || 0;
    }

    get shares_outstanding_float(): number {
        return this._info?.shares_outstanding_float || 0;
    }

    get shares_outstanding_total(): number {
        return this._info?.shares_outstanding_total || 0;
    }

    // ============================================================
    // Session & Market
    // ============================================================

    get expiration_date(): number {
        return this._info?.expiration_date || 0;
    }

    get session(): string {
        return this._info?.session || '';
    }

    get volumetype(): string {
        return this._info?.volumetype || '';
    }

    // ============================================================
    // Price & Contract Info
    // ============================================================

    get mincontract(): number {
        return this._info?.mincontract || 1;
    }

    get minmove(): number {
        return this._info?.minmove || 1;
    }

    get mintick(): number {
        return this._info?.mintick || 0.01;
    }

    get pointvalue(): number {
        return this._info?.pointvalue || 1;
    }

    get pricescale(): number {
        return this._info?.pricescale || 100;
    }

    // ============================================================
    // Analyst Ratings
    // ============================================================

    get recommendations_buy(): number {
        return this._info?.recommendations_buy || 0;
    }

    get recommendations_buy_strong(): number {
        return this._info?.recommendations_buy_strong || 0;
    }

    get recommendations_date(): number {
        return this._info?.recommendations_date || 0;
    }

    get recommendations_hold(): number {
        return this._info?.recommendations_hold || 0;
    }

    get recommendations_sell(): number {
        return this._info?.recommendations_sell || 0;
    }

    get recommendations_sell_strong(): number {
        return this._info?.recommendations_sell_strong || 0;
    }

    get recommendations_total(): number {
        return this._info?.recommendations_total || 0;
    }

    // ============================================================
    // Price Targets
    // ============================================================

    get target_price_average(): number {
        return this._info?.target_price_average || 0;
    }

    get target_price_date(): number {
        return this._info?.target_price_date || 0;
    }

    get target_price_estimates(): number {
        return this._info?.target_price_estimates || 0;
    }

    get target_price_high(): number {
        return this._info?.target_price_high || 0;
    }

    get target_price_low(): number {
        return this._info?.target_price_low || 0;
    }

    get target_price_median(): number {
        return this._info?.target_price_median || 0;
    }
}
