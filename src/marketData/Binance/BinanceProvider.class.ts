// SPDX-License-Identifier: AGPL-3.0-only

const BINANCE_API_URL_DEFAULT = 'https://api.binance.com/api/v3';
const BINANCE_API_URL_US = 'https://api.binance.us/api/v3';

const timeframe_to_binance = {
    '1': '1m', // 1 minute
    '3': '3m', // 3 minutes
    '5': '5m', // 5 minutes
    '15': '15m', // 15 minutes
    '30': '30m', // 30 minutes
    '45': null, // 45 minutes (not directly supported by Binance, needs custom handling)
    '60': '1h', // 1 hour
    '120': '2h', // 2 hours
    '180': null, // 3 hours (not directly supported by Binance, needs custom handling)
    '240': '4h', // 4 hours
    '4H': '4h', // 4 hours
    '1D': '1d', // 1 day
    D: '1d', // 1 day
    '1W': '1w', // 1 week
    W: '1w', // 1 week
    '1M': '1M', // 1 month
    M: '1M', // 1 month
};

import { IProvider, ISymbolInfo } from '@pinets/marketData/IProvider';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

class CacheManager<T> {
    private cache: Map<string, CacheEntry<T>>;
    private readonly cacheDuration: number;

    constructor(cacheDuration: number = 5 * 60 * 1000) {
        // Default 5 minutes
        this.cache = new Map();
        this.cacheDuration = cacheDuration;
    }

    private generateKey(params: Record<string, any>): string {
        return Object.entries(params)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => `${key}:${value}`)
            .join('|');
    }

    get(params: Record<string, any>): T | null {
        const key = this.generateKey(params);
        const cached = this.cache.get(key);

        if (!cached) return null;

        if (Date.now() - cached.timestamp > this.cacheDuration) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    set(params: Record<string, any>, data: T): void {
        const key = this.generateKey(params);
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }

    clear(): void {
        this.cache.clear();
    }

    // Optional: method to remove expired entries
    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.cacheDuration) {
                this.cache.delete(key);
            }
        }
    }
}

export class BinanceProvider implements IProvider {
    private cacheManager: CacheManager<any[]>;
    private activeApiUrl: string | null = null; // Persist the working endpoint

    constructor() {
        this.cacheManager = new CacheManager(5 * 60 * 1000); // 5 minutes cache duration
    }

    /**
     * Normalize closeTime to TradingView convention: closeTime = next bar's openTime.
     * Binance raw API returns closeTime as (nextBarOpen - 1ms). For all bars except the
     * last, we use the next bar's actual openTime (exact). For the last bar, we add 1ms
     * to the raw value.
     */
    private _normalizeCloseTime(data: any[]): void {
        for (let i = 0; i < data.length - 1; i++) {
            data[i].closeTime = data[i + 1].openTime;
        }
        if (data.length > 0) {
            data[data.length - 1].closeTime = data[data.length - 1].closeTime + 1;
        }
    }

    /**
     * Resolves the working Binance API endpoint.
     * Tries default first, then falls back to US endpoint.
     * Caches the working endpoint for future calls.
     */
    private async getBaseUrl(): Promise<string> {
        if (this.activeApiUrl) {
            return this.activeApiUrl;
        }

        // Try default endpoint
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
            const response = await fetch(`${BINANCE_API_URL_DEFAULT}/ping`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (response.ok) {
                this.activeApiUrl = BINANCE_API_URL_DEFAULT;
                return this.activeApiUrl;
            }
        } catch (e) {
            // Default failed, try US endpoint
            // console.warn('Binance default API unreachable, trying US endpoint...');
        }

        // Try US endpoint
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(`${BINANCE_API_URL_US}/ping`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (response.ok) {
                this.activeApiUrl = BINANCE_API_URL_US;
                return this.activeApiUrl;
            }
        } catch (e) {
            // Both failed
        }

        // Fallback to default if check fails entirely (let actual request fail)
        return BINANCE_API_URL_DEFAULT;
    }

    /**
     * Fetch a single chunk of raw kline data from the Binance API (no closeTime normalization).
     * Used internally by pagination methods that assemble chunks before normalizing.
     */
    private async _fetchRawChunk(tickerId: string, timeframe: string, limit?: number, sDate?: number, eDate?: number): Promise<any[]> {
        const interval = timeframe_to_binance[timeframe.toUpperCase()];
        if (!interval) {
            console.error(`Unsupported timeframe: ${timeframe}`);
            return [];
        }

        const baseUrl = await this.getBaseUrl();
        let url = `${baseUrl}/klines?symbol=${tickerId}&interval=${interval}`;

        if (limit) {
            url += `&limit=${Math.min(limit, 1000)}`;
        }
        if (sDate) {
            url += `&startTime=${sDate}`;
        }
        if (eDate) {
            url += `&endTime=${eDate}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();

        return result.map((item) => ({
            openTime: parseInt(item[0]),
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4]),
            volume: parseFloat(item[5]),
            closeTime: parseInt(item[6]),
            quoteAssetVolume: parseFloat(item[7]),
            numberOfTrades: parseInt(item[8]),
            takerBuyBaseAssetVolume: parseFloat(item[9]),
            takerBuyQuoteAssetVolume: parseFloat(item[10]),
            ignore: item[11],
        }));
    }

    async getMarketDataInterval(tickerId: string, timeframe: string, sDate: number, eDate: number): Promise<any> {
        try {
            const interval = timeframe_to_binance[timeframe.toUpperCase()];
            if (!interval) {
                console.error(`Unsupported timeframe: ${timeframe}`);
                return [];
            }

            const timeframeDurations = {
                '1m': 60 * 1000,
                '3m': 3 * 60 * 1000,
                '5m': 5 * 60 * 1000,
                '15m': 15 * 60 * 1000,
                '30m': 30 * 60 * 1000,
                '1h': 60 * 60 * 1000,
                '2h': 2 * 60 * 60 * 1000,
                '4h': 4 * 60 * 60 * 1000,
                '1d': 24 * 60 * 60 * 1000,
                '1w': 7 * 24 * 60 * 60 * 1000,
                '1M': 30 * 24 * 60 * 60 * 1000,
            };

            let allData = [];
            let currentStart = sDate;
            const endTime = eDate;
            const intervalDuration = timeframeDurations[interval];

            if (!intervalDuration) {
                console.error(`Duration not defined for interval: ${interval}`);
                return [];
            }

            while (currentStart < endTime) {
                const chunkEnd = Math.min(currentStart + 1000 * intervalDuration, endTime);

                const data = await this._fetchRawChunk(tickerId, timeframe, 1000, currentStart, chunkEnd);

                if (data.length === 0) break;

                allData = allData.concat(data);

                // Raw closeTime is (nextBarOpen - 1ms), so +1 gives the correct pagination cursor
                currentStart = data[data.length - 1].closeTime + 1;
            }

            // Normalize closeTime on the fully assembled data
            this._normalizeCloseTime(allData);
            return allData;
        } catch (error) {
            console.error('Error in getMarketDataInterval:', error);
            return [];
        }
    }

    private async getMarketDataBackwards(tickerId: string, timeframe: string, limit: number, endTime?: number): Promise<any[]> {
        let remaining = limit;
        let allData: any[] = [];
        let currentEndTime = endTime;

        // Safety break to prevent infinite loops
        let iterations = 0;
        const maxIterations = Math.ceil(limit / 1000) + 5;

        while (remaining > 0 && iterations < maxIterations) {
            iterations++;
            const fetchSize = Math.min(remaining, 1000);

            // Fetch raw batch (no normalization yet)
            const data = await this._fetchRawChunk(tickerId, timeframe, fetchSize, undefined, currentEndTime);

            if (data.length === 0) break;

            // Prepend data since we fetch most recent first
            allData = data.concat(allData);
            remaining -= data.length;

            // Update end time for next batch to be just before the oldest candle we got
            currentEndTime = data[0].openTime - 1;

            if (data.length < fetchSize) {
                break;
            }
        }

        // Normalize closeTime on the fully assembled data
        this._normalizeCloseTime(allData);
        return allData;
    }

    async getMarketData(tickerId: string, timeframe: string, limit?: number, sDate?: number, eDate?: number): Promise<any> {
        try {
            // Check cache first
            // Skip cache if eDate is undefined (live request) to ensure we get fresh data
            const shouldCache = eDate !== undefined;
            const cacheParams = { tickerId, timeframe, limit, sDate, eDate };

            if (shouldCache) {
                const cachedData = this.cacheManager.get(cacheParams);
                if (cachedData) {
                    return cachedData;
                }
            }

            const interval = timeframe_to_binance[timeframe.toUpperCase()];
            if (!interval) {
                console.error(`Unsupported timeframe: ${timeframe}`);
                return [];
            }

            // Determine if we need to paginate
            const needsPagination = this.shouldPaginate(timeframe, limit, sDate, eDate);

            if (needsPagination) {
                if (sDate && eDate) {
                    // Forward pagination — already normalized by getMarketDataInterval
                    const allData = await this.getMarketDataInterval(tickerId, timeframe, sDate, eDate);
                    const result = limit ? allData.slice(0, limit) : allData;

                    this.cacheManager.set(cacheParams, result);
                    return result;
                } else if (limit && limit > 1000) {
                    // Backward pagination — already normalized by getMarketDataBackwards
                    const result = await this.getMarketDataBackwards(tickerId, timeframe, limit, eDate);

                    this.cacheManager.set(cacheParams, result);
                    return result;
                }
            }

            // Single chunk — fetch raw, then normalize
            const data = await this._fetchRawChunk(tickerId, timeframe, limit, sDate, eDate);
            this._normalizeCloseTime(data);

            if (shouldCache) {
                this.cacheManager.set(cacheParams, data);
            }

            return data;
        } catch (error) {
            console.error('Error in binance.klines:', error);
            return [];
        }
    }

    /**
     * Determines if pagination is needed based on the parameters
     */
    private shouldPaginate(timeframe: string, limit?: number, sDate?: number, eDate?: number): boolean {
        // If limit is explicitly > 1000, we need pagination
        if (limit && limit > 1000) {
            return true;
        }

        // If we have both start and end dates, calculate required candles
        if (sDate && eDate) {
            const interval = timeframe_to_binance[timeframe.toUpperCase()];
            const timeframeDurations = {
                '1m': 60 * 1000,
                '3m': 3 * 60 * 1000,
                '5m': 5 * 60 * 1000,
                '15m': 15 * 60 * 1000,
                '30m': 30 * 60 * 1000,
                '1h': 60 * 60 * 1000,
                '2h': 2 * 60 * 60 * 1000,
                '4h': 4 * 60 * 60 * 1000,
                '1d': 24 * 60 * 60 * 1000,
                '1w': 7 * 24 * 60 * 60 * 1000,
                '1M': 30 * 24 * 60 * 60 * 1000,
            };

            const intervalDuration = timeframeDurations[interval];
            if (intervalDuration) {
                const requiredCandles = Math.ceil((eDate - sDate) / intervalDuration);
                // Need pagination if date range requires more than 1000 candles
                return requiredCandles > 1000;
            }
        }

        return false;
    }

    async getSymbolInfo(tickerId: string): Promise<ISymbolInfo> {
        try {
            // tickerId comes in as "BTCUSDT" or "BTCUSDT.P"
            // We keep it EXACTLY as is for ticker field (Pine Script includes .P)

            let marketType: 'crypto' | 'futures' = 'crypto';
            const baseUrl = await this.getBaseUrl();
            let apiUrl = baseUrl; // Default to resolved spot API
            let apiSymbol = tickerId; // Symbol for API call
            let contractType = '';

            if (tickerId.endsWith('.P')) {
                // USDT-Margined Perpetual Futures
                marketType = 'futures';
                apiSymbol = tickerId.replace('.P', ''); // Remove .P only for Binance API call
                apiUrl = 'https://fapi.binance.com/fapi/v1';
                contractType = 'Perpetual';
                // NOTE: ticker field will KEEP the .P suffix (as Pine Script does)
            } else if (tickerId.includes('_')) {
                // COIN-Margined Delivery Futures
                marketType = 'futures';
                apiSymbol = tickerId; // API might use this format directly
                apiUrl = 'https://dapi.binance.com/dapi/v1';
                contractType = 'Delivery';
            }

            // Fetch from appropriate API
            // Note: Spot API supports ?symbol= parameter, but futures APIs return all symbols
            const url = marketType === 'crypto' ? `${apiUrl}/exchangeInfo?symbol=${apiSymbol}` : `${apiUrl}/exchangeInfo`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            const symbols = result.symbols;

            if (!symbols || symbols.length === 0) {
                console.error(`Symbol ${tickerId} not found`);
                return null;
            }

            // For futures API, we need to find the specific symbol ourselves
            const symbolData = marketType === 'futures' ? symbols.find((s: any) => s.symbol === apiSymbol) : symbols[0];

            if (!symbolData) {
                console.error(`Symbol ${apiSymbol} not found in exchange info`);
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
            console.error('Error in binance.exchangeInfo:', error);
            return null;
        }
    }

    configure(config: any): void {
        // Nothing to configure in BinanceProvider
    }
}
