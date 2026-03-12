// SPDX-License-Identifier: AGPL-3.0-only

import { IProvider, ISymbolInfo } from '@pinets/marketData/IProvider';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
export class MockProvider implements IProvider {
    private dataCache: Map<string, Kline[]> = new Map();
    private exchangeInfoCache: { spot?: any; futures?: any } = {};
    private dataDirectory: string;

    constructor(dataDirectory?: string) {
        // Default to tests/compatibility/_data directory
        // Calculate path relative to this file's location
        if (dataDirectory) {
            this.dataDirectory = dataDirectory;
        } else {
            // Navigate from src/marketData/Mock to tests/compatibility/_data
            const projectRoot = path.resolve(__dirname, '../../../');
            this.dataDirectory = path.join(projectRoot, 'tests', 'compatibility', '_data');
        }
    }
    public configure({ dataDirectory }: { dataDirectory?: string }): void {
        if (dataDirectory) {
            this.dataDirectory = dataDirectory;
        }
    }

    /**
     * Generates a cache key for the data file
     */
    private getDataFileName(tickerId: string, timeframe: string, sDate?: number, eDate?: number): string | null {
        // If we have date range, try to find matching file
        if (sDate && eDate) {
            return `${tickerId}-${timeframe}-${sDate}-${eDate}.json`;
        }

        // Otherwise, try to find any file matching symbol and timeframe
        // This will require listing directory and finding best match
        return null;
    }

    /**
     * Loads data from JSON file
     */
    private loadDataFromFile(fileName: string): Kline[] {
        const cacheKey = `file:${fileName}`;

        // Check cache first
        if (this.dataCache.has(cacheKey)) {
            return this.dataCache.get(cacheKey)!;
        }

        const filePath = path.join(this.dataDirectory, fileName);

        if (!fs.existsSync(filePath)) {
            throw new Error(`Mock data file not found: ${filePath}`);
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const data: Kline[] = JSON.parse(fileContent);

        // Cache the data
        this.dataCache.set(cacheKey, data);

        return data;
    }

    /**
     * Finds the best matching data file for the given parameters
     */
    private findDataFile(tickerId: string, timeframe: string, sDate?: number, eDate?: number): string | null {
        if (!fs.existsSync(this.dataDirectory)) {
            return null;
        }

        const files = fs.readdirSync(this.dataDirectory).filter((file) => file.endsWith('.json'));

        // If we have date range, try exact match first
        if (sDate && eDate) {
            const exactMatch = `${tickerId}-${timeframe}-${sDate}-${eDate}.json`;
            if (files.includes(exactMatch)) {
                return exactMatch;
            }
        }

        // Find files matching symbol and timeframe pattern
        const pattern = new RegExp(`^${tickerId}-${timeframe}-(\\d+)-(\\d+)\\.json$`);
        const matchingFiles = files
            .filter((file) => pattern.test(file))
            .map((file) => {
                const match = file.match(pattern)!;
                return {
                    file,
                    startTime: parseInt(match[1]),
                    endTime: parseInt(match[2]),
                };
            })
            .sort((a, b) => b.endTime - a.endTime); // Sort by endTime descending (most recent first)

        if (matchingFiles.length === 0) {
            return null;
        }

        // If we have date range, find file that contains it
        if (sDate && eDate) {
            const containingFile = matchingFiles.find((f) => f.startTime <= sDate && f.endTime >= eDate);
            if (containingFile) {
                return containingFile.file;
            }
        }

        // Return the most recent file (likely contains the data we need)
        return matchingFiles[0].file;
    }

    /**
     * Filters data based on date range and limit
     */
    private filterData(data: Kline[], sDate?: number, eDate?: number, limit?: number): Kline[] {
        let filtered = data;

        // Filter by date range
        if (sDate || eDate) {
            filtered = data.filter((kline) => {
                const matchesStart = !sDate || kline.openTime >= sDate;
                const matchesEnd = !eDate || kline.openTime <= eDate;
                return matchesStart && matchesEnd;
            });
        }

        // Sort by openTime to ensure chronological order
        filtered.sort((a, b) => a.openTime - b.openTime);

        // Apply limit
        if (limit && limit > 0) {
            filtered = filtered.slice(0, limit);
        }

        return filtered;
    }

    /**
     * Normalizes timeframe to match file naming convention
     */
    private normalizeTimeframe(timeframe: string): string {
        const timeframeMap: Record<string, string> = {
            '1': '1m',
            '3': '3m',
            '5': '5m',
            '15': '15m',
            '30': '30m',
            '60': '1h',
            '120': '2h',
            '240': '4h',
            '4H': '4h',
            '1D': '1d',
            D: '1d',
            '1W': '1w',
            W: '1w',
            '1M': '1M',
            M: '1M',
        };

        return timeframeMap[timeframe.toUpperCase()] || timeframe.toLowerCase();
    }

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
    async getMarketData(tickerId: string, timeframe: string, limit?: number, sDate?: number, eDate?: number): Promise<Kline[]> {
        try {
            // Normalize timeframe
            const normalizedTimeframe = this.normalizeTimeframe(timeframe);

            // Find matching data file
            const dataFile = this.findDataFile(tickerId, normalizedTimeframe, sDate, eDate);

            if (!dataFile) {
                console.warn(`No mock data file found for ${tickerId} ${normalizedTimeframe}. ` + `Searched in: ${this.dataDirectory}`);
                return [];
            }

            // Load data from file
            const allData = this.loadDataFromFile(dataFile);

            // Filter and limit data
            const filteredData = this.filterData(allData, sDate, eDate, limit);

            // Normalize closeTime to TV convention (nextBar.openTime)
            this._normalizeCloseTime(filteredData);

            return filteredData;
        } catch (error) {
            console.error(`Error in MockProvider.getMarketData:`, error);
            return [];
        }
    }

    /**
     * Loads exchange info from JSON file
     */
    private loadExchangeInfo(type: 'spot' | 'futures'): any {
        // Check cache first
        if (this.exchangeInfoCache[type]) {
            return this.exchangeInfoCache[type];
        }

        const fileName = type === 'spot' ? 'api-exchangeInfo.json' : 'fapi-exchangeInfo.json';
        const filePath = path.join(this.dataDirectory, fileName);

        if (!fs.existsSync(filePath)) {
            console.warn(`Exchange info file not found: ${filePath}`);
            return null;
        }

        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(fileContent);

            // Cache the data
            this.exchangeInfoCache[type] = data;

            return data;
        } catch (error) {
            console.error(`Error loading exchange info from ${fileName}:`, error);
            return null;
        }
    }

    /**
     * Implements IProvider.getSymbolInfo
     *
     * @param tickerId - Symbol name (e.g., 'BTCUSDT' or 'BTCUSDT.P')
     * @returns Promise<ISymbolInfo> - Symbol information
     */
    async getSymbolInfo(tickerId: string): Promise<ISymbolInfo> {
        try {
            // tickerId comes in as "BTCUSDT" or "BTCUSDT.P"
            // We keep it EXACTLY as is for ticker field (Pine Script includes .P)

            let marketType: 'crypto' | 'futures' = 'crypto';
            let apiSymbol = tickerId;
            let contractType = '';

            if (tickerId.endsWith('.P')) {
                // USDT-Margined Perpetual Futures
                marketType = 'futures';
                apiSymbol = tickerId.replace('.P', ''); // Remove .P for API lookup
                contractType = 'Perpetual';
            } else if (tickerId.includes('_')) {
                // COIN-Margined Delivery Futures
                marketType = 'futures';
                apiSymbol = tickerId;
                contractType = 'Delivery';
            }

            // Load appropriate exchange info
            const exchangeInfo = this.loadExchangeInfo(marketType === 'futures' ? 'futures' : 'spot');

            if (!exchangeInfo || !exchangeInfo.symbols) {
                console.error(`Exchange info not available for ${marketType}`);
                return null;
            }

            // Find the symbol
            const symbolData = exchangeInfo.symbols.find((s: any) => s.symbol === apiSymbol);

            if (!symbolData) {
                console.error(`Symbol ${apiSymbol} not found in ${marketType} exchange info`);
                return null;
            }

            // Extract filters
            const priceFilter = symbolData.filters?.find((f: any) => f.filterType === 'PRICE_FILTER');
            const lotSizeFilter = symbolData.filters?.find((f: any) => f.filterType === 'LOT_SIZE');

            const tickSize = priceFilter ? parseFloat(priceFilter.tickSize) : 0.01;
            const minQty = lotSizeFilter ? parseFloat(lotSizeFilter.minQty) : 0;
            const pricescale = Math.round(1 / tickSize);

            const baseAsset = symbolData.baseAsset;
            const quoteAsset = symbolData.quoteAsset;

            // Build description
            const typeLabel = contractType ? ` ${contractType}` : '';
            const description = `${baseAsset} / ${quoteAsset}${typeLabel}`;

            const symbolInfo: ISymbolInfo = {
                // Symbol Identification
                ticker: tickerId, // KEEP ORIGINAL including .P if present!
                tickerid: `BINANCE:${tickerId}`, // Also keep .P here
                prefix: 'BINANCE',
                root: baseAsset, // Just the base asset: "BTC"
                description: description,
                type: marketType,
                main_tickerid: `BINANCE:${tickerId}`,
                current_contract: contractType,
                isin: '',

                // Currency & Location
                basecurrency: baseAsset,
                currency: quoteAsset,
                timezone: 'Etc/UTC',
                country: '',

                // Price & Contract Info
                mintick: tickSize,
                pricescale: pricescale,
                minmove: 1,
                pointvalue: symbolData.contractSize || 1,
                mincontract: minQty,

                // Session & Market
                session: '24x7',
                volumetype: 'base',
                expiration_date: symbolData.deliveryDate || 0,

                // Company Data (N/A for crypto)
                employees: 0,
                industry: '',
                sector: '',
                shareholders: 0,
                shares_outstanding_float: 0,
                shares_outstanding_total: 0,

                // Analyst Ratings (N/A for crypto)
                recommendations_buy: 0,
                recommendations_buy_strong: 0,
                recommendations_date: 0,
                recommendations_hold: 0,
                recommendations_sell: 0,
                recommendations_sell_strong: 0,
                recommendations_total: 0,

                // Price Targets (N/A for crypto)
                target_price_average: 0,
                target_price_date: 0,
                target_price_estimates: 0,
                target_price_high: 0,
                target_price_low: 0,
                target_price_median: 0,
            };

            return symbolInfo;
        } catch (error) {
            console.error('Error in MockProvider.getSymbolInfo:', error);
            return null;
        }
    }

    /**
     * Normalize closeTime to TradingView convention: closeTime = next bar's openTime.
     * Mock data files contain raw Binance data where closeTime = (nextBarOpen - 1ms).
     * For all bars except the last, we use the next bar's actual openTime. For the
     * last bar, we add 1ms to the raw value.
     */
    private _normalizeCloseTime(data: Kline[]): void {
        for (let i = 0; i < data.length - 1; i++) {
            data[i].closeTime = data[i + 1].openTime;
        }
        if (data.length > 0) {
            data[data.length - 1].closeTime = data[data.length - 1].closeTime + 1;
        }
    }

    /**
     * Clears the data cache
     */
    clearCache(): void {
        this.dataCache.clear();
        this.exchangeInfoCache = {};
    }

    /**
     * Sets a custom data directory
     */
    setDataDirectory(directory: string): void {
        (this as any).dataDirectory = directory;
        this.clearCache();
    }
}
