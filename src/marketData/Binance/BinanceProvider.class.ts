// SPDX-License-Identifier: AGPL-3.0-only

const BINANCE_API_URL_DEFAULT = 'https://api.binance.com/api/v3';
const BINANCE_API_URL_US = 'https://api.binance.us/api/v3';
const MAX_PAGINATION_REQUESTS = 200;
const MAX_PAGINATION_BARS = 100_000;
const MAX_PAGE_BARS = 1000;
const REQUEST_TIMEOUT_MS = 15_000;
const PING_TIMEOUT_MS = 5_000;
const PAGINATION_TIMEOUT_MS = 60_000;

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

import { ISymbolInfo, ProviderRequestOptions } from '@pinets/marketData/IProvider';
import { BaseProvider } from '@pinets/marketData/BaseProvider';
import { stripTickerModifier } from '../../tickerModifier';
import { Kline, INTERVAL_DURATION_MS } from '@pinets/marketData/types';
import { readBudgetedJson } from '../readBudgetedJson';
import { PineRuntimeError } from '../../errors/PineRuntimeError';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

/** Config for BinanceProvider (no API key needed). */
export interface BinanceProviderConfig {
    /** Cancels in-flight requests and pagination when aborted. */
    signal?: AbortSignal;
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

export class BinanceProvider extends BaseProvider<BinanceProviderConfig> {
    private cacheManager: CacheManager<Kline[]>;
    private activeApiUrl: string | null = null; // Persist the working endpoint
    private requestSignal?: AbortSignal;

    constructor(config: BinanceProviderConfig = {}) {
        super({ requiresApiKey: false, providerName: 'Binance' });
        this.cacheManager = new CacheManager(5 * 60 * 1000); // 5 minutes cache duration
        this.requestSignal = config.signal;
    }

    configure(config: BinanceProviderConfig): void {
        super.configure(config);
        this.requestSignal = config?.signal;
    }

    private async request<T>(url: string, read: (response: Response) => Promise<T>, deadline?: number, timeoutMs = REQUEST_TIMEOUT_MS, options?: ProviderRequestOptions): Promise<T> {
        const signals = [...new Set([this.requestSignal, options?.signal, options?.budget?.providerSignal].filter((s): s is AbortSignal => s !== undefined))];
        if (signals.some((signal) => signal.aborted)) throw new Error('Binance request aborted');
        options?.budget?.chargeProviderPage();
        const effectiveDeadline = Math.min(deadline ?? Infinity, options?.deadline ?? Infinity, options?.budget?.providerDeadline ?? Infinity);

        const remainingMs = effectiveDeadline === Infinity ? timeoutMs : Math.min(timeoutMs, effectiveDeadline - Date.now());
        if (remainingMs <= 0) throw new Error('Binance request deadline exceeded');

        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout> | undefined;
        let onAbort: (() => void) | undefined;
        const cancelled = new Promise<never>((_, reject) => {
            onAbort = () => {
                controller.abort();
                reject(new Error('Binance request aborted'));
            };
            for (const signal of signals) signal.addEventListener('abort', onAbort, { once: true });
            if (signals.some((signal) => signal.aborted)) onAbort();
            timer = setTimeout(() => {
                controller.abort();
                reject(new Error('Binance request timed out'));
            }, remainingMs);
        });

        try {
            return await Promise.race([fetch(url, { signal: controller.signal }).then(read), cancelled]);
        } finally {
            if (timer !== undefined) clearTimeout(timer);
            if (onAbort) for (const signal of signals) signal.removeEventListener('abort', onAbort);
        }
    }

    /**
     * Resolves the working Binance API endpoint.
     * Tries default first, then falls back to US endpoint.
     * Caches the working endpoint for future calls.
     */
    private async getBaseUrl(deadline?: number, options?: ProviderRequestOptions): Promise<string> {
        if (this.activeApiUrl) {
            return this.activeApiUrl;
        }

        // Try default endpoint
        try {
            const available = await this.request(`${BINANCE_API_URL_DEFAULT}/ping`, async (response) => response.ok, deadline, PING_TIMEOUT_MS, options);
            if (available) {
                this.activeApiUrl = BINANCE_API_URL_DEFAULT;
                return this.activeApiUrl;
            }
        } catch (e) {
            if (e instanceof PineRuntimeError) throw e;
            if (this.requestSignal?.aborted || (e instanceof Error && e.message === 'Binance request aborted') ||
                (deadline !== undefined && Date.now() >= deadline)) throw e;
            // Default failed, try US endpoint
            // console.warn('Binance default API unreachable, trying US endpoint...');
        }

        // Try US endpoint
        try {
            const available = await this.request(`${BINANCE_API_URL_US}/ping`, async (response) => response.ok, deadline, PING_TIMEOUT_MS, options);
            if (available) {
                this.activeApiUrl = BINANCE_API_URL_US;
                return this.activeApiUrl;
            }
        } catch (e) {
            if (e instanceof PineRuntimeError) throw e;
            if (this.requestSignal?.aborted || (e instanceof Error && e.message === 'Binance request aborted') ||
                (deadline !== undefined && Date.now() >= deadline)) throw e;
            // Both failed
        }

        // Fallback to default if check fails entirely (let actual request fail)
        return BINANCE_API_URL_DEFAULT;
    }

    /**
     * Fetch a single chunk of raw kline data from the Binance API (no closeTime normalization).
     * Used internally by pagination methods that assemble chunks before normalizing.
     */
    private async _fetchRawChunk(tickerId: string, timeframe: string, limit?: number, sDate?: number, eDate?: number, deadline?: number, options?: ProviderRequestOptions): Promise<Kline[]> {
        const interval = timeframe_to_binance[timeframe.toUpperCase()];
        if (!interval) {
            console.error(`Unsupported timeframe: ${timeframe}`);
            return [];
        }

        const baseUrl = await this.getBaseUrl(deadline, options);
        const url = new URL(`${baseUrl}/klines`);
        url.searchParams.set('symbol', tickerId);
        url.searchParams.set('interval', interval);

        if (limit) {
            url.searchParams.set('limit', String(Math.min(limit, MAX_PAGE_BARS)));
        }
        if (sDate !== undefined) {
            url.searchParams.set('startTime', String(sDate));
        }
        if (eDate !== undefined) {
            url.searchParams.set('endTime', String(eDate));
        }

        const result = await this.request(url.toString(), async (response) => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return readBudgetedJson(response, options?.budget);
        }, deadline, REQUEST_TIMEOUT_MS, options);
        if (!Array.isArray(result) || result.length > MAX_PAGE_BARS || (limit && result.length > limit)) {
            throw new Error('Invalid Binance kline page size');
        }
        options?.recordRawBars?.(result.length);

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

    async getMarketDataInterval(tickerId: string, timeframe: string, sDate: number, eDate: number, options?: ProviderRequestOptions): Promise<Kline[]> {
        try {
            const interval = timeframe_to_binance[timeframe.toUpperCase()];
            if (!interval) {
                console.error(`Unsupported timeframe: ${timeframe}`);
                return [];
            }

            const allData: Kline[] = [];
            const seenOpenTimes = new Set<number>();
            const seenPages = new Set<string>();
            let currentStart = sDate;
            const endTime = eDate;
            const intervalDuration = INTERVAL_DURATION_MS[interval];
            const deadline = Date.now() + PAGINATION_TIMEOUT_MS;
            let requests = 0;
            const fetchPage = async (pageLimit: number, start: number, end?: number): Promise<Kline[]> => {
                if (requests >= MAX_PAGINATION_REQUESTS) throw new Error('Binance pagination request limit exceeded');
                requests++;
                return this._fetchRawChunk(tickerId, timeframe, pageLimit, start, end, deadline, options);
            };

            if (!intervalDuration) {
                console.error(`Duration not defined for interval: ${interval}`);
                return [];
            }

            while (currentStart < endTime) {
                if (allData.length >= MAX_PAGINATION_BARS) throw new Error('Binance pagination bar limit exceeded');
                const chunkEnd = Math.min(currentStart + 1000 * intervalDuration, endTime);

                const data = await fetchPage(MAX_PAGE_BARS, currentStart, chunkEnd);

                if (data.length === 0) {
                    // Nothing in this chunk: the range may start before the symbol was listed.
                    // Jump to the first candle after currentStart instead of giving up.
                    const [first] = await fetchPage(1, currentStart);
                    if (first && !Number.isSafeInteger(first.openTime)) throw new Error('Invalid Binance pagination cursor');
                    if (!first || first.openTime >= endTime || first.openTime <= currentStart) break;
                    currentStart = first.openTime;
                    continue;
                }

                // Raw closeTime is (nextBarOpen - 1ms), so +1 gives the correct pagination cursor
                const last = data[data.length - 1];
                const nextStart = last.closeTime + 1;
                if (!Number.isSafeInteger(nextStart) || nextStart <= currentStart) {
                    throw new Error('Binance pagination cursor did not advance');
                }

                const pageSignature = `${data.length}:${data[0].openTime}:${last.openTime}:${last.closeTime}`;
                if (seenPages.has(pageSignature)) throw new Error('Binance pagination page repeated');
                seenPages.add(pageSignature);

                for (const bar of data) {
                    if (!Number.isSafeInteger(bar.openTime) || !Number.isSafeInteger(bar.closeTime) || bar.closeTime < bar.openTime) {
                        throw new Error('Invalid Binance kline timestamp');
                    }
                    if (seenOpenTimes.has(bar.openTime)) continue;
                    if (allData.length >= MAX_PAGINATION_BARS) throw new Error('Binance pagination bar limit exceeded');
                    seenOpenTimes.add(bar.openTime);
                    allData.push(bar);
                }
                currentStart = nextStart;
            }

            // Normalize closeTime on the fully assembled data
            this.normalizeCloseTime(allData);
            return allData;
        } catch (error) {
            if (error instanceof PineRuntimeError) throw error;
            console.error('Error in getMarketDataInterval:', error);
            return [];
        }
    }

    private async getMarketDataBackwards(tickerId: string, timeframe: string, limit: number, endTime?: number, options?: ProviderRequestOptions): Promise<Kline[]> {
        if (!Number.isSafeInteger(limit) || limit < 0 || limit > MAX_PAGINATION_BARS) {
            throw new Error('Binance pagination bar limit exceeded');
        }
        let remaining = limit;
        let allData: Kline[] = [];
        let currentEndTime = endTime;
        const seenOpenTimes = new Set<number>();
        const deadline = Date.now() + PAGINATION_TIMEOUT_MS;

        // Safety break to prevent infinite loops
        let iterations = 0;
        const maxIterations = Math.min(Math.ceil(limit / 1000) + 5, MAX_PAGINATION_REQUESTS);

        while (remaining > 0 && iterations < maxIterations) {
            iterations++;
            const fetchSize = Math.min(remaining, 1000);

            // Fetch raw batch (no normalization yet)
            const data = await this._fetchRawChunk(tickerId, timeframe, fetchSize, undefined, currentEndTime, deadline, options);

            if (data.length === 0) break;

            const nextEndTime = data[0].openTime - 1;
            if (!Number.isSafeInteger(nextEndTime) || (currentEndTime !== undefined && nextEndTime >= currentEndTime)) {
                throw new Error('Binance pagination cursor did not retreat');
            }

            const uniqueData: Kline[] = [];
            for (const bar of data) {
                if (!Number.isSafeInteger(bar.openTime) || !Number.isSafeInteger(bar.closeTime) || bar.closeTime < bar.openTime) {
                    throw new Error('Invalid Binance kline timestamp');
                }
                if (seenOpenTimes.has(bar.openTime)) continue;
                seenOpenTimes.add(bar.openTime);
                uniqueData.push(bar);
            }

            // Prepend data since we fetch most recent first
            allData = uniqueData.concat(allData);
            remaining -= uniqueData.length;

            // Update end time for next batch to be just before the oldest candle we got
            currentEndTime = nextEndTime;

            if (data.length < fetchSize) {
                break;
            }
        }
        if (remaining > 0 && iterations >= maxIterations) throw new Error('Binance pagination request limit exceeded');

        // Normalize closeTime on the fully assembled data
        this.normalizeCloseTime(allData);
        return allData;
    }

    protected getSupportedTimeframes(): Set<string> {
        return new Set(['1', '3', '5', '15', '30', '60', '120', '240', 'D', 'W', 'M']);
    }

    protected aggregatesOnCalendarGrid(): boolean {
        return true;
    }

    protected async _getMarketDataNative(tickerId: string, timeframe: string, limit?: number, sDate?: number, eDate?: number, options?: ProviderRequestOptions): Promise<Kline[]> {
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
            const needsPagination = this.shouldPaginate(limit, sDate, eDate);

            if (needsPagination) {
                if (sDate && eDate) {
                    // Forward pagination — already normalized by getMarketDataInterval
                    const allData = await this.getMarketDataInterval(tickerId, timeframe, sDate, eDate, options);
                    const result = limit ? allData.slice(0, limit) : allData;

                    this.cacheManager.set(cacheParams, result);
                    return result;
                } else if (limit && limit > 1000) {
                    // Backward pagination — already normalized by getMarketDataBackwards
                    const result = await this.getMarketDataBackwards(tickerId, timeframe, limit, eDate, options);

                    this.cacheManager.set(cacheParams, result);
                    return result;
                }
            }

            // Single chunk — fetch raw, then normalize
            const data = await this._fetchRawChunk(tickerId, timeframe, limit, sDate, eDate, undefined, options);
            this.normalizeCloseTime(data);

            if (shouldCache) {
                this.cacheManager.set(cacheParams, data);
            }

            return data;
        } catch (error) {
            if (error instanceof PineRuntimeError) throw error;
            console.error('Error in binance.klines:', error);
            return [];
        }
    }

    /**
     * Determines if pagination is needed based on the parameters
     */
    private shouldPaginate(limit?: number, sDate?: number, eDate?: number): boolean {
        // If limit is explicitly > 1000, we need pagination
        if (limit && limit > 1000) {
            return true;
        }

        // A date range always goes through getMarketDataInterval, even when it fits in one
        // request: a single request without `limit` only gets Binance's default of 500 candles.
        return !!(sDate && eDate);
    }

    async getSymbolInfo(tickerId: string, options?: ProviderRequestOptions): Promise<ISymbolInfo> {
        tickerId = stripTickerModifier(tickerId); // chart-type modifiers never reach the venue API
        try {
            // tickerId comes in as "BTCUSDT" or "BTCUSDT.P"
            // We keep it EXACTLY as is for ticker field (Pine Script includes .P)

            let marketType: 'crypto' | 'futures' = 'crypto';
            const baseUrl = await this.getBaseUrl(undefined, options);
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
            const url = new URL(`${apiUrl}/exchangeInfo`);
            if (marketType === 'crypto') url.searchParams.set('symbol', apiSymbol);
            const result = await this.request(url.toString(), async (response) => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return readBudgetedJson<any>(response, options?.budget);
            }, undefined, REQUEST_TIMEOUT_MS, options);
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
                root: tickerId, // TradingView: the ticker itself ("BTCUSDT", "BTCUSDT.P")
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
                session: 'regular',
                volumetype: 'base',
                expiration_date: symbolData.deliveryDate || NaN,

                // Company data, ratings and price targets: na for crypto, as on TradingView
                employees: NaN,
                industry: '',
                sector: '',
                shareholders: NaN,
                shares_outstanding_float: NaN,
                shares_outstanding_total: NaN,

                // Analyst Ratings (N/A for crypto)
                recommendations_buy: NaN,
                recommendations_buy_strong: NaN,
                recommendations_date: NaN,
                recommendations_hold: NaN,
                recommendations_sell: NaN,
                recommendations_sell_strong: NaN,
                recommendations_total: NaN,

                // Price Targets (N/A for crypto)
                target_price_average: NaN,
                target_price_date: NaN,
                target_price_estimates: NaN,
                target_price_high: NaN,
                target_price_low: NaN,
                target_price_median: NaN,
            };

            return symbolInfo;
        } catch (error) {
            if (error instanceof PineRuntimeError) throw error;
            console.error('Error in binance.exchangeInfo:', error);
            return null;
        }
    }

}
