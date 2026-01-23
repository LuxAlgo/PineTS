import { IProvider, ISymbolInfo } from '@pinets/marketData/IProvider';
interface Kline {
    openTime: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    closeTime: number;
    quoteAssetVolume: number;
    numberOfTrades: number;
    takerBuyBaseAssetVolume: number;
    takerBuyQuoteAssetVolume: number;
    ignore: number | string;
}
/**
 * Mock Market Data Provider for Unit Tests
 *
 * This provider reads market data from pre-fetched JSON files instead of making API calls.
 * It's designed to be used in unit tests to provide consistent, offline test data.
 *
 * Usage:
 * ```typescript
 * const mockProvider = new MockProvider();
 * const data = await mockProvider.getMarketData('BTCUSDC', '1h', 100, startTime, endTime);
 * ```
 *
 * The provider looks for JSON files in the tests/compatibility/_data directory
 * with the naming pattern: {SYMBOL}-{TIMEFRAME}-{START_TIME}-{END_TIME}.json
 *
 * Example: BTCUSDC-1h-1704067200000-1763683199000.json
 */
export declare class MockProvider implements IProvider {
    private dataCache;
    private exchangeInfoCache;
    private readonly dataDirectory;
    constructor(dataDirectory?: string);
    /**
     * Generates a cache key for the data file
     */
    private getDataFileName;
    /**
     * Loads data from JSON file
     */
    private loadDataFromFile;
    /**
     * Finds the best matching data file for the given parameters
     */
    private findDataFile;
    /**
     * Filters data based on date range and limit
     */
    private filterData;
    /**
     * Normalizes timeframe to match file naming convention
     */
    private normalizeTimeframe;
    /**
     * Implements IProvider.getMarketData
     *
     * @param tickerId - Symbol (e.g., 'BTCUSDC')
     * @param timeframe - Timeframe (e.g., '1h', '60', 'D')
     * @param limit - Optional limit on number of candles to return
     * @param sDate - Optional start date (timestamp in milliseconds)
     * @param eDate - Optional end date (timestamp in milliseconds)
     * @returns Promise<Kline[]> - Array of candle data
     */
    getMarketData(tickerId: string, timeframe: string, limit?: number, sDate?: number, eDate?: number): Promise<Kline[]>;
    /**
     * Loads exchange info from JSON file
     */
    private loadExchangeInfo;
    /**
     * Implements IProvider.getSymbolInfo
     *
     * @param tickerId - Symbol name (e.g., 'BTCUSDT' or 'BTCUSDT.P')
     * @returns Promise<ISymbolInfo> - Symbol information
     */
    getSymbolInfo(tickerId: string): Promise<ISymbolInfo>;
    /**
     * Clears the data cache
     */
    clearCache(): void;
    /**
     * Sets a custom data directory
     */
    setDataDirectory(directory: string): void;
}
export {};
