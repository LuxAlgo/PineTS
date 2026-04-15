// SPDX-License-Identifier: AGPL-3.0-only

import { ISymbolInfo, ApiKeyProviderConfig } from '@pinets/marketData/IProvider';
import { BaseProvider } from '@pinets/marketData/BaseProvider';
import { Kline, PeriodType, computeNextPeriodStart, computeSessionClose } from '@pinets/marketData/types';

// ── Constants ────────────────────────────────────────────────────────────

const FMP_BASE_URL = 'https://financialmodelingprep.com';

// Common ISO 4217 currency codes for forex pair detection
const FOREX_CURRENCIES = new Set([
    'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD',
    'SEK', 'NOK', 'DKK', 'SGD', 'HKD', 'KRW', 'MXN', 'ZAR',
    'TRY', 'BRL', 'INR', 'CNY', 'PLN', 'CZK', 'HUF', 'ILS',
    'THB', 'TWD', 'PHP', 'IDR', 'MYR', 'RUB', 'CLP', 'COP',
]);

/**
 * Maps PineTS timeframes to FMP endpoint paths.
 *
 * Daily data: `/stable/historical-price-eod/full`
 * Intraday:   `/stable/historical-chart/{interval}` (paid plans only)
 */
const TIMEFRAME_TO_FMP: Record<string, { endpoint: string; interval?: string; type: 'daily' | 'intraday' }> = {
    // Daily — uses the EOD endpoint
    '1D': { endpoint: '/stable/historical-price-eod/full', type: 'daily' },
    'D':  { endpoint: '/stable/historical-price-eod/full', type: 'daily' },

    // Intraday — uses the chart endpoint (paid plans)
    '1':   { endpoint: '/stable/historical-chart/1min',   interval: '1min',   type: 'intraday' },
    '5':   { endpoint: '/stable/historical-chart/5min',   interval: '5min',   type: 'intraday' },
    '15':  { endpoint: '/stable/historical-chart/15min',  interval: '15min',  type: 'intraday' },
    '30':  { endpoint: '/stable/historical-chart/30min',  interval: '30min',  type: 'intraday' },
    '60':  { endpoint: '/stable/historical-chart/1hour',  interval: '1hour',  type: 'intraday' },
    '240': { endpoint: '/stable/historical-chart/4hour',  interval: '4hour',  type: 'intraday' },
    '4H':  { endpoint: '/stable/historical-chart/4hour',  interval: '4hour',  type: 'intraday' },
};

/**
 * Maps exchange names returned by FMP to IANA timezones.
 * Falls back to 'America/New_York' for unknown US exchanges.
 */
const EXCHANGE_TIMEZONE: Record<string, string> = {
    'NASDAQ':    'America/New_York',
    'NYSE':      'America/New_York',
    'AMEX':      'America/New_York',
    'NYSEArca':  'America/New_York',
    'BATS':      'America/New_York',
    'OTC':       'America/New_York',
    'PNK':       'America/New_York',
    'TSX':       'America/Toronto',
    'TSXV':      'America/Toronto',
    'LSE':       'Europe/London',
    'EURONEXT':  'Europe/Paris',
    'XETRA':     'Europe/Berlin',
    'JPX':       'Asia/Tokyo',
    'HKSE':      'Asia/Hong_Kong',
    'SSE':       'Asia/Shanghai',
    'SHZ':       'Asia/Shanghai',
    'ASX':       'Australia/Sydney',
    'NSE':       'Asia/Kolkata',
    'BSE':       'Asia/Kolkata',
    'KRX':       'Asia/Seoul',
    'CRYPTO':    'Etc/UTC',
};

const EXCHANGE_SESSION: Record<string, string> = {
    'NASDAQ':    '0930-1600',
    'NYSE':      '0930-1600',
    'AMEX':      '0930-1600',
    'NYSEArca':  '0930-1600',
    'BATS':      '0930-1600',
    'OTC':       '0930-1600',
    'PNK':       '0930-1600',
    'TSX':       '0930-1600',
    'TSXV':      '0930-1600',
    'LSE':       '0800-1630',
    'EURONEXT':  '0900-1730',
    'XETRA':     '0900-1730',
    'JPX':       '0900-1530',
    'HKSE':      '0930-1600',
    'SSE':       '0930-1500',
    'SHZ':       '0930-1500',
    'ASX':       '1000-1600',
    'NSE':       '0915-1530',
    'BSE':       '0915-1530',
    'KRX':       '0900-1530',
    'CRYPTO':    '24x7',
};

/**
 * Maps FMP interval strings to { periodType, multiplier } for calendar-aware closeTime.
 */
const FMP_INTERVAL_PERIOD: Record<string, { periodType: 'minute' | 'hour' | 'day'; multiplier: number }> = {
    'daily':  { periodType: 'day',    multiplier: 1 },
    '1min':   { periodType: 'minute', multiplier: 1 },
    '5min':   { periodType: 'minute', multiplier: 5 },
    '15min':  { periodType: 'minute', multiplier: 15 },
    '30min':  { periodType: 'minute', multiplier: 30 },
    '1hour':  { periodType: 'hour',   multiplier: 1 },
    '4hour':  { periodType: 'hour',   multiplier: 4 },
};

// ── Config ───────────────────────────────────────────────────────────────

/** Configuration for FMPProvider — requires an API key. */
export interface FMPProviderConfig extends ApiKeyProviderConfig {
    /** Optional: override the base URL (e.g. for proxy or self-hosted). */
    baseUrl?: string;
}

// ── FMP API response shapes ─────────────────────────────────────────────

interface FMPDailyBar {
    symbol: string;
    date: string;       // "2025-01-10"
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    change: number;
    changePercent: number;
    vwap: number;
}

interface FMPIntradayBar {
    date: string;       // "2025-01-10 09:30:00"
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface FMPProfile {
    symbol: string;
    price: number;
    marketCap: number;
    beta: number;
    lastDividend: number;
    range: string;
    change: number;
    changePercentage: number;
    volume: number;
    averageVolume: number;
    companyName: string;
    currency: string;
    cik: string;
    isin: string;
    cusip: string;
    exchangeFullName: string;
    exchange: string;
    industry: string;
    website: string;
    description: string;
    ceo: string;
    sector: string;
    country: string;
    fullTimeEmployees: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    image: string;
    ipoDate: string;
    defaultImage: boolean;
    isEtf: boolean;
    isActivelyTrading: boolean;
    isAdr: boolean;
    isFund: boolean;
}

// ── Provider ─────────────────────────────────────────────────────────────

/**
 * Financial Modeling Prep (FMP) market data provider.
 *
 * Supports stocks, ETFs, crypto, and forex via FMP's stable API.
 *
 * ## Usage
 *
 * ### Direct instantiation:
 * ```typescript
 * const fmp = new FMPProvider({ apiKey: 'your-key' });
 * const pineTS = new PineTS(fmp, 'AAPL', 'D', null, sDate, eDate);
 * ```
 *
 * ### Via Provider registry:
 * ```typescript
 * Provider.FMP.configure({ apiKey: 'your-key' });
 * const pineTS = new PineTS(Provider.FMP, 'AAPL', 'D', null, sDate, eDate);
 * ```
 *
 * ## API Key
 * Get a free API key (250 req/day) at https://financialmodelingprep.com/
 * Intraday data (1min, 5min, 15min, 30min, 1h, 4h) requires a paid plan.
 *
 * ## Symbol Format
 * Use standard ticker symbols: `AAPL`, `MSFT`, `SPY`, `BTCUSD`, `EURUSD`
 */
export class FMPProvider extends BaseProvider<FMPProviderConfig> {
    private _apiKey: string | null = null;
    private _baseUrl: string = FMP_BASE_URL;
    private _profileCache: Map<string, FMPProfile> = new Map();
    private _symbolInfoCache: Map<string, ISymbolInfo> = new Map();
    private _mintickCache: Map<string, number> = new Map();

    constructor(config?: FMPProviderConfig) {
        super({ requiresApiKey: true, providerName: 'FMP' });
        if (config?.apiKey) {
            this.configure(config);
        }
    }

    configure(config: FMPProviderConfig): void {
        super.configure(config);
        this._apiKey = config.apiKey;
        if (config.baseUrl) {
            this._baseUrl = config.baseUrl;
        }
    }

    // ── Market Data ──────────────────────────────────────────────────────

    protected getSupportedTimeframes(): Set<string> {
        return new Set(['1', '5', '15', '30', '60', '240', 'D']);
    }

    protected async _getMarketDataNative(
        tickerId: string,
        timeframe: string,
        limit?: number,
        sDate?: number,
        eDate?: number,
    ): Promise<Kline[]> {
        this.ensureConfigured();

        try {
            const tfKey = timeframe.toUpperCase();
            const mapping = TIMEFRAME_TO_FMP[tfKey] || TIMEFRAME_TO_FMP[timeframe];

            if (!mapping) {
                console.error(`FMP: Unsupported timeframe: ${timeframe}`);
                return [];
            }

            let klines: Kline[];
            if (mapping.type === 'intraday') {
                klines = await this._fetchIntradayData(tickerId, mapping.endpoint, mapping.interval!, sDate, eDate, limit);
            } else {
                klines = await this._fetchDailyData(tickerId, sDate, eDate, limit);
            }

            // Compute and cache mintick from historical data if not already cached
            if (klines.length > 0 && !this._mintickCache.has(tickerId)) {
                const mintick = this._estimateMintick(klines);
                if (mintick !== undefined) {
                    this._mintickCache.set(tickerId, mintick);
                }
            }

            return klines;
        } catch (error) {
            console.error('Error in FMPProvider.getMarketData:', error);
            return [];
        }
    }

    /**
     * Fetch daily EOD data from FMP and convert to Kline format.
     */
    private async _fetchDailyData(
        tickerId: string,
        sDate?: number,
        eDate?: number,
        limit?: number,
    ): Promise<Kline[]> {
        let url = `${this._baseUrl}/stable/historical-price-eod/full?symbol=${tickerId}&apikey=${this._apiKey}`;

        if (sDate) url += `&from=${this._msToDateStr(sDate)}`;
        if (eDate) url += `&to=${this._msToDateStr(eDate)}`;

        const response = await fetch(url);
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`FMP HTTP ${response.status}: ${text}`);
        }

        const data: FMPDailyBar[] = await response.json();

        if (!Array.isArray(data) || data.length === 0) return [];

        // FMP returns data in DESCENDING order (newest first) — reverse to oldest first
        data.reverse();

        // Apply limit (take the last N bars = most recent)
        const bars = limit && limit > 0 && limit < data.length
            ? data.slice(data.length - limit)
            : data;

        // Resolve session info for closeTime computation
        const { session, timezone } = await this._resolveSessionInfo(tickerId);

        // Convert to Kline
        const klines: Kline[] = bars.map((bar) => {
            const openTime = this._dateStrToMs(bar.date);
            const closeTime = computeSessionClose(openTime, session, timezone, 'day');

            return {
                openTime,
                open: bar.open,
                high: bar.high,
                low: bar.low,
                close: bar.close,
                volume: bar.volume,
                closeTime,
                quoteAssetVolume: 0,
                numberOfTrades: 0,
                takerBuyBaseAssetVolume: 0,
                takerBuyQuoteAssetVolume: 0,
                ignore: 0,
            };
        });

        return klines;
    }

    /**
     * Fetch intraday chart data from FMP and convert to Kline format.
     * Note: Requires a paid FMP plan.
     */
    private async _fetchIntradayData(
        tickerId: string,
        endpoint: string,
        interval: string,
        sDate?: number,
        eDate?: number,
        limit?: number,
    ): Promise<Kline[]> {
        let url = `${this._baseUrl}${endpoint}?symbol=${tickerId}&apikey=${this._apiKey}`;

        if (sDate) url += `&from=${this._msToDateStr(sDate)}`;
        if (eDate) url += `&to=${this._msToDateStr(eDate)}`;

        const response = await fetch(url);
        if (!response.ok) {
            const text = await response.text();
            // Check for restricted endpoint error (free plan)
            if (response.status === 403 || text.includes('Restricted Endpoint')) {
                console.error(
                    `FMP: Intraday data (${interval}) requires a paid plan. ` +
                    `Use daily timeframe ('D') with a free API key, or upgrade at https://financialmodelingprep.com/`
                );
                return [];
            }
            throw new Error(`FMP HTTP ${response.status}: ${text}`);
        }

        const data: FMPIntradayBar[] = await response.json();

        if (!Array.isArray(data) || data.length === 0) return [];

        // FMP returns intraday data in DESCENDING order — reverse
        data.reverse();

        const bars = limit && limit > 0 && limit < data.length
            ? data.slice(data.length - limit)
            : data;

        const { periodType, multiplier } = FMP_INTERVAL_PERIOD[interval] || { periodType: 'minute' as const, multiplier: 1 };

        // Resolve session info for closeTime computation
        const { session, timezone } = await this._resolveSessionInfo(tickerId);

        const klines: Kline[] = bars.map((bar) => {
            const openTime = this._dateTimeStrToMs(bar.date);
            const closeTime = computeSessionClose(openTime, session, timezone, periodType, multiplier);

            return {
                openTime,
                open: bar.open,
                high: bar.high,
                low: bar.low,
                close: bar.close,
                volume: bar.volume,
                closeTime,
                quoteAssetVolume: 0,
                numberOfTrades: 0,
                takerBuyBaseAssetVolume: 0,
                takerBuyQuoteAssetVolume: 0,
                ignore: 0,
            };
        });

        return klines;
    }

    // ── Symbol Info ──────────────────────────────────────────────────────

    async getSymbolInfo(tickerId: string): Promise<ISymbolInfo> {
        this.ensureConfigured();

        // Return cached symbolInfo if available
        if (this._symbolInfoCache.has(tickerId)) {
            return this._symbolInfoCache.get(tickerId)!;
        }

        try {
            const profile = await this._fetchProfile(tickerId);

            // Determine asset type from profile or ticker heuristics
            // Check forex BEFORE crypto since EURUSD matches both patterns
            let type = 'stock';
            if (profile?.isEtf) type = 'etf';
            else if (profile?.isFund) type = 'fund';
            else if (this._isForex(tickerId)) type = 'forex';
            else if (this._isCrypto(tickerId)) type = 'crypto';

            const exchange = profile?.exchange || (type === 'crypto' ? 'CRYPTO' : type === 'forex' ? 'FX' : '');
            const timezone = type === 'crypto' ? 'Etc/UTC' : type === 'forex' ? 'Etc/UTC' : (EXCHANGE_TIMEZONE[exchange] || 'America/New_York');
            const session = type === 'crypto' ? '24x7' : type === 'forex' ? '0000-0000' : (EXCHANGE_SESSION[exchange] || '0930-1600');

            // Derive currency from ticker for forex (e.g. EURUSD → quote = USD)
            const currency = profile?.currency || (this._isForex(tickerId) ? tickerId.slice(3, 6) : 'USD');
            const basecurrency = this._isForex(tickerId) ? tickerId.slice(0, 3) : (profile?.currency || 'USD');

            // Use estimated mintick from historical data if available
            const mintick = this._mintickCache.get(tickerId) ?? 0.01;
            const pricescale = Math.round(1 / mintick);
            const minmove = Math.round(mintick * pricescale);

            const symbolInfo: ISymbolInfo = {
                // Symbol Identification
                ticker: profile?.symbol || tickerId,
                tickerid: `${exchange}:${profile?.symbol || tickerId}`,
                prefix: exchange,
                root: profile?.symbol || tickerId,
                description: profile?.companyName || tickerId,
                type,
                main_tickerid: `${exchange}:${profile?.symbol || tickerId}`,
                current_contract: '',
                isin: profile?.isin || '',

                // Currency & Location
                basecurrency,
                currency,
                timezone,
                country: profile?.country || '',

                // Price & Contract Info
                mintick,
                pricescale,
                minmove,
                pointvalue: 1,
                mincontract: 0,

                // Session & Market
                session,
                volumetype: 'base',
                expiration_date: 0,

                // Company Data
                employees: profile ? (parseInt(profile.fullTimeEmployees) || 0) : 0,
                industry: profile?.industry || '',
                sector: profile?.sector || '',
                shareholders: 0,
                shares_outstanding_float: 0,
                shares_outstanding_total: 0,

                // Analyst Ratings (not provided by FMP profile)
                recommendations_buy: 0,
                recommendations_buy_strong: 0,
                recommendations_date: 0,
                recommendations_hold: 0,
                recommendations_sell: 0,
                recommendations_sell_strong: 0,
                recommendations_total: 0,

                // Price Targets (not provided by FMP profile)
                target_price_average: 0,
                target_price_date: 0,
                target_price_estimates: 0,
                target_price_high: 0,
                target_price_low: 0,
                target_price_median: 0,
            };

            // Cache when mintick was computed from real data
            if (this._mintickCache.has(tickerId)) {
                this._symbolInfoCache.set(tickerId, symbolInfo);
            }

            return symbolInfo;
        } catch (error) {
            console.error('Error in FMPProvider.getSymbolInfo:', error);
            return null;
        }
    }

    // ── Private helpers ──────────────────────────────────────────────────

    /**
     * Estimate mintick from historical OHLC data.
     * Computes the smallest non-zero |close - open| and |high - low| diff,
     * then rounds to the nearest power-of-10 bucket.
     * Returns undefined if no valid diffs found.
     */
    private _estimateMintick(klines: Kline[]): number | undefined {
        const diffs: number[] = [];
        for (let i = 0; i < klines.length; i++) {
            const k = klines[i];
            const co = Math.abs(k.close - k.open);
            const hl = Math.abs(k.high - k.low);
            if (co > 0) diffs.push(co);
            if (hl > 0) diffs.push(hl);
            // Consecutive close-to-close diffs capture finer granularity
            if (i > 0) {
                const cc = Math.abs(k.close - klines[i - 1].close);
                if (cc > 0) diffs.push(cc);
            }
        }

        if (diffs.length === 0) return undefined;

        const raw = Math.min(...diffs);

        // Bucket by first significant digit: round to 1×10^k or 10×10^k
        const k = Math.floor(Math.log10(raw));
        const y = raw / (10 ** k);
        const leading = Math.floor(y + 1e-12);
        const bucketed = (leading < 5 ? 1 : 10) * (10 ** k);

        // If bucketed >= 1, the data granularity is too coarse to determine
        // the real tick size (e.g. BTC daily bars). Fall back to 0.01.
        if (bucketed >= 1) return 0.01;

        return bucketed;
    }

    private async _fetchProfile(tickerId: string): Promise<FMPProfile | null> {
        // Check cache
        if (this._profileCache.has(tickerId)) {
            return this._profileCache.get(tickerId)!;
        }

        const url = `${this._baseUrl}/stable/profile?symbol=${tickerId}&apikey=${this._apiKey}`;
        const response = await fetch(url);
        if (!response.ok) return null;

        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) return null;

        const profile = data[0] as FMPProfile;
        this._profileCache.set(tickerId, profile);
        return profile;
    }

    /**
     * Resolve session string and timezone for a ticker by fetching its profile.
     * Falls back to NYSE defaults if profile is unavailable.
     */
    private async _resolveSessionInfo(tickerId: string): Promise<{ session: string; timezone: string }> {
        try {
            const profile = await this._fetchProfile(tickerId);
            if (profile) {
                const exchange = profile.exchange || '';
                const isCrypto = this._isCrypto(tickerId);
                const timezone = isCrypto ? 'Etc/UTC' : (EXCHANGE_TIMEZONE[exchange] || 'America/New_York');
                const session = isCrypto ? '24x7' : (EXCHANGE_SESSION[exchange] || '0930-1600');
                return { session, timezone };
            }
        } catch {
            // Ignore — fall through to defaults
        }
        return { session: '0930-1600', timezone: 'America/New_York' };
    }

    /** Convert ms timestamp to FMP date string "YYYY-MM-DD". */
    private _msToDateStr(ms: number): string {
        return new Date(ms).toISOString().split('T')[0];
    }

    /** Convert FMP date string "YYYY-MM-DD" to ms timestamp (UTC midnight). */
    private _dateStrToMs(dateStr: string): number {
        return new Date(dateStr + 'T00:00:00Z').getTime();
    }

    /** Convert FMP datetime string "YYYY-MM-DD HH:MM:SS" to ms timestamp. */
    private _dateTimeStrToMs(dateTimeStr: string): number {
        // FMP intraday dates are in exchange local time; treat as UTC for consistency
        return new Date(dateTimeStr.replace(' ', 'T') + 'Z').getTime();
    }

    /** Heuristic: forex pairs are exactly 6 uppercase chars (two 3-letter currency codes). */
    private _isForex(tickerId: string): boolean {
        return /^[A-Z]{6}$/.test(tickerId) && FOREX_CURRENCIES.has(tickerId.slice(0, 3)) && FOREX_CURRENCIES.has(tickerId.slice(3, 6));
    }

    /** Heuristic: crypto tickers end with USD/USDT/BTC/ETH and are not forex pairs. */
    private _isCrypto(tickerId: string): boolean {
        if (this._isForex(tickerId)) return false;
        return /^[A-Z]+(USD|USDT|BTC|ETH)$/.test(tickerId) && tickerId.length <= 15;
    }
}
