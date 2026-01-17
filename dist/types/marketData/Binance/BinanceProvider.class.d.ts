import { IProvider, ISymbolInfo } from '@pinets/marketData/IProvider';
export declare class BinanceProvider implements IProvider {
    private cacheManager;
    private activeApiUrl;
    constructor();
    /**
     * Resolves the working Binance API endpoint.
     * Tries default first, then falls back to US endpoint.
     * Caches the working endpoint for future calls.
     */
    private getBaseUrl;
    getMarketDataInterval(tickerId: string, timeframe: string, sDate: number, eDate: number): Promise<any>;
    getMarketData(tickerId: string, timeframe: string, limit?: number, sDate?: number, eDate?: number): Promise<any>;
    /**
     * Determines if pagination is needed based on the parameters
     */
    private shouldPaginate;
    getSymbolInfo(tickerId: string): Promise<ISymbolInfo>;
}
