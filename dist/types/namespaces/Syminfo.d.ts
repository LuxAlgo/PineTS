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
 * Syminfo namespace - provides symbol information
 *
 * Supports both property access and callable functions:
 * - syminfo.ticker - returns current symbol's ticker
 * - syminfo.ticker("NASDAQ:AAPL") - extracts "AAPL" from the tickerid
 * - syminfo.prefix - returns current symbol's prefix/exchange
 * - syminfo.prefix("NASDAQ:AAPL") - extracts "NASDAQ" from the tickerid
 */
export declare class Syminfo {
    private context;
    private _info;
    constructor(context: any);
    /**
     * Sets the symbol info from the provider
     */
    setSymbolInfo(info: ISymbolInfo): void;
    /**
     * Returns the prefix (exchange) of the symbol
     * - As property: returns current symbol's prefix
     * - As function: syminfo.prefix("EXCHANGE:SYMBOL") extracts "EXCHANGE"
     */
    get prefix(): SyminfoCallable;
    /**
     * Returns the ticker of the symbol (without exchange prefix)
     * - As property: returns current symbol's ticker
     * - As function: syminfo.ticker("EXCHANGE:SYMBOL") extracts "SYMBOL"
     */
    get ticker(): SyminfoCallable;
    get current_contract(): string;
    get description(): string;
    get isin(): string;
    get main_tickerid(): string;
    get root(): string;
    get tickerid(): string;
    get type(): string;
    get basecurrency(): string;
    get country(): string;
    get currency(): string;
    get timezone(): string;
    get employees(): number;
    get industry(): string;
    get sector(): string;
    get shareholders(): number;
    get shares_outstanding_float(): number;
    get shares_outstanding_total(): number;
    get expiration_date(): number;
    get session(): string;
    get volumetype(): string;
    get mincontract(): number;
    get minmove(): number;
    get mintick(): number;
    get pointvalue(): number;
    get pricescale(): number;
    get recommendations_buy(): number;
    get recommendations_buy_strong(): number;
    get recommendations_date(): number;
    get recommendations_hold(): number;
    get recommendations_sell(): number;
    get recommendations_sell_strong(): number;
    get recommendations_total(): number;
    get target_price_average(): number;
    get target_price_date(): number;
    get target_price_estimates(): number;
    get target_price_high(): number;
    get target_price_low(): number;
    get target_price_median(): number;
}
export {};
