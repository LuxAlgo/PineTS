// SPDX-License-Identifier: AGPL-3.0-only

export type ISymbolInfo = {
    //Symbol Identification
    current_contract: string;
    description: string;
    isin: string;
    main_tickerid: string;
    prefix: string;
    root: string;
    ticker: string;
    tickerid: string;
    type: string;

    //  "Currency & Location": {
    basecurrency: string;
    country: string;
    currency: string;
    timezone: string;

    // Company Data
    employees: number;
    industry: string;
    sector: string;
    shareholders: number;
    shares_outstanding_float: number;
    shares_outstanding_total: number;

    // Session & Market
    expiration_date: number; //Pinescript timestamp
    session: string;
    volumetype: string;

    // Price & Contract Info
    mincontract: number;
    minmove: number;
    mintick: number;
    pointvalue: number;
    pricescale: number;

    // Analyst Ratings
    recommendations_buy: number;
    recommendations_buy_strong: number;
    recommendations_date: number; //Pinescript timestamp
    recommendations_hold: number;
    recommendations_sell: number;
    recommendations_sell_strong: number;
    recommendations_total: number;

    // Price Targets
    target_price_average: number;
    target_price_date: number; //Pinescript timestamp
    target_price_estimates: number;
    target_price_high: number;
    target_price_low: number;
    target_price_median: number;
};
/**
 * Market data provider interface.
 *
 * ## closeTime convention
 * Providers MUST return `closeTime` following the TradingView convention:
 * `closeTime` = the timestamp of the **start of the next bar** (not the last
 * millisecond of the current bar).  For example, a weekly bar opening on
 * Monday 2019-01-07T00:00Z should have `closeTime = 2019-01-14T00:00Z`.
 *
 * If a provider's raw data uses a different convention (e.g., Binance returns
 * `nextBarOpen - 1ms`), the provider must normalize before returning.
 */
export interface IProvider {
    getMarketData(tickerId: string, timeframe: string, limit?: number, sDate?: number, eDate?: number): Promise<any>;
    getSymbolInfo(tickerId: string): Promise<ISymbolInfo>;
    configure(config: any): void;
}
