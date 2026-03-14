// SPDX-License-Identifier: AGPL-3.0-only

import { ISymbolInfo, ApiKeyProviderConfig } from '@pinets/marketData/IProvider';
import { BaseProvider } from '@pinets/marketData/BaseProvider';
import { Kline, PeriodType, computeNextPeriodStart, localTimeToUTC } from '@pinets/marketData/types';

// ── Constants ────────────────────────────────────────────────────────────

const ALPACA_DATA_URL = 'https://data.alpaca.markets';
const ALPACA_TRADING_URL_PAPER = 'https://paper-api.alpaca.markets/v2';
const ALPACA_TRADING_URL_LIVE = 'https://api.alpaca.markets/v2';

/** Max bars per page (Alpaca caps at 10,000). */
const MAX_PAGE_LIMIT = 10_000;

/**
 * Maps PineTS timeframes to Alpaca timeframe strings.
 *
 * Alpaca supports: 1Min-59Min, 1Hour-23Hour, 1Day, 1Week, 1Month-12Month
 */
const TIMEFRAME_TO_ALPACA: Record<string, string> = {
    // Minutes
    '1':   '1Min',
    '3':   '3Min',
    '5':   '5Min',
    '15':  '15Min',
    '30':  '30Min',
    // Hours
    '60':  '1Hour',
    '120': '2Hour',
    '240': '4Hour',
    '4H':  '4Hour',
    // Daily / Weekly / Monthly
    '1D':  '1Day',
    'D':   '1Day',
    '1W':  '1Week',
    'W':   '1Week',
    '1M':  '1Month',
    'M':   '1Month',
};

/**
 * Maps exchange names from Alpaca asset info to IANA timezones.
 */
const EXCHANGE_TIMEZONE: Record<string, string> = {
    'NASDAQ':  'America/New_York',
    'NYSE':    'America/New_York',
    'AMEX':    'America/New_York',
    'ARCA':    'America/New_York',
    'BATS':    'America/New_York',
    'OTC':     'America/New_York',
    'CRYPTO':  'Etc/UTC',
};

const EXCHANGE_SESSION: Record<string, string> = {
    'NASDAQ':  '0930-1600',
    'NYSE':    '0930-1600',
    'AMEX':    '0930-1600',
    'ARCA':    '0930-1600',
    'BATS':    '0930-1600',
    'OTC':     '0930-1600',
    'CRYPTO':  '24x7',
};

/**
 * Maps Alpaca timeframe unit suffixes to PeriodType for calendar-aware closeTime.
 */
const ALPACA_UNIT_TO_PERIOD: Record<string, PeriodType> = {
    'Min':   'minute',
    'Hour':  'hour',
    'Day':   'day',
    'Week':  'week',
    'Month': 'month',
};

// ── Config ───────────────────────────────────────────────────────────────

/**
 * Configuration for AlpacaProvider.
 *
 * @property apiKey    - Alpaca API Key ID
 * @property apiSecret - Alpaca API Secret Key
 * @property paper     - Use paper trading endpoint for asset info (default: true)
 * @property feed      - Market data feed: 'sip' (paid, full market) or 'iex' (free tier). Default: 'sip'
 * @property dataUrl   - Override the market data base URL
 * @property tradingUrl - Override the trading/asset API base URL
 */
export interface AlpacaProviderConfig extends ApiKeyProviderConfig {
    apiSecret: string;
    paper?: boolean;
    feed?: 'sip' | 'iex';
    dataUrl?: string;
    tradingUrl?: string;
}

// ── Alpaca API response shapes ──────────────────────────────────────────

interface AlpacaBar {
    t: string;      // ISO 8601 timestamp
    o: number;      // open
    h: number;      // high
    l: number;      // low
    c: number;      // close
    v: number;      // volume
    n: number;      // trade count
    vw: number;     // VWAP
}

interface AlpacaBarsResponse {
    bars: Record<string, AlpacaBar[]>;
    next_page_token: string | null;
}

interface AlpacaCalendarDay {
    date: string;           // "2024-11-29"
    open: string;           // "09:30"
    close: string;          // "13:00" (early close) or "16:00" (normal)
    session_open: string;   // "09:30"
    session_close: string;  // "16:00"
}

interface AlpacaAsset {
    id: string;
    class: string;          // 'us_equity' | 'crypto'
    exchange: string;       // 'NASDAQ' | 'NYSE' | 'CRYPTO' etc
    symbol: string;
    name: string;
    status: string;         // 'active' | 'inactive'
    tradable: boolean;
    marginable: boolean;
    shortable: boolean;
    easy_to_borrow: boolean;
    fractionable: boolean;
    attributes: string[];
    min_order_size?: string;
    min_trade_increment?: string;
    price_increment?: string;
}

// ── Provider ─────────────────────────────────────────────────────────────

/**
 * Alpaca Markets data provider.
 *
 * Supports US stocks and crypto via Alpaca's Market Data API v2.
 * All timeframes (1Min through 1Month) are natively supported.
 *
 * ## Usage
 *
 * ### Direct instantiation:
 * ```typescript
 * const alpaca = new AlpacaProvider({
 *     apiKey: 'PK...',
 *     apiSecret: '...',
 * });
 * const pineTS = new PineTS(alpaca, 'AAPL', 'D', null, sDate, eDate);
 * ```
 *
 * ### Via Provider registry:
 * ```typescript
 * Provider.Alpaca.configure({ apiKey: 'PK...', apiSecret: '...' });
 * const pineTS = new PineTS(Provider.Alpaca, 'AAPL', 'D', null, sDate, eDate);
 * ```
 *
 * ## API Keys
 * Get free API keys at https://alpaca.markets/
 * Free tier provides IEX data; paid plan adds SIP (full market) data.
 *
 * ## Symbol Format
 * - Stocks: `AAPL`, `MSFT`, `SPY`
 * - Crypto: `BTC/USD`, `ETH/USD` (slash notation)
 */
export class AlpacaProvider extends BaseProvider<AlpacaProviderConfig> {
    private _apiKey: string | null = null;
    private _apiSecret: string | null = null;
    private _dataUrl: string = ALPACA_DATA_URL;
    private _tradingUrl: string = ALPACA_TRADING_URL_PAPER;
    private _feed: 'sip' | 'iex' | null = null;
    private _assetCache: Map<string, AlpacaAsset> = new Map();
    /** Calendar cache: date string "YYYY-MM-DD" → { open, close } times. */
    private _calendarCache: Map<string, AlpacaCalendarDay> = new Map();

    constructor(config?: AlpacaProviderConfig) {
        super({ requiresApiKey: true, providerName: 'Alpaca' });
        if (config?.apiKey && config?.apiSecret) {
            this.configure(config);
        }
    }

    configure(config: AlpacaProviderConfig): void {
        super.configure(config);
        this._apiKey = config.apiKey;
        this._apiSecret = config.apiSecret;

        if (config.feed) this._feed = config.feed;
        if (config.dataUrl) this._dataUrl = config.dataUrl;
        if (config.tradingUrl) {
            this._tradingUrl = config.tradingUrl;
        } else if (config.paper === false) {
            this._tradingUrl = ALPACA_TRADING_URL_LIVE;
        }
    }

    // ── Auth headers ─────────────────────────────────────────────────────

    private _headers(): Record<string, string> {
        return {
            'APCA-API-KEY-ID': this._apiKey!,
            'APCA-API-SECRET-KEY': this._apiSecret!,
        };
    }

    // ── Market Data ──────────────────────────────────────────────────────

    protected getSupportedTimeframes(): Set<string> {
        return new Set(['1', '3', '5', '15', '30', '45', '60', '120', '180', '240', 'D', 'W', 'M']);
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
            const alpacaTf = this._resolveTimeframe(timeframe);
            if (!alpacaTf) {
                console.error(`Alpaca: Unsupported timeframe: ${timeframe}`);
                return [];
            }

            const isCrypto = this._isCrypto(tickerId);
            const allBars = await this._fetchAllBars(tickerId, alpacaTf, isCrypto, sDate, eDate, limit);

            if (allBars.length === 0) return [];

            const { periodType, multiplier } = this._parseAlpacaTimeframe(alpacaTf);

            if (isCrypto) {
                // Crypto: 24/7 market, use fixed duration (no session boundaries)
                return this._convertBarsCrypto(allBars, periodType, multiplier);
            }

            // Stocks: use Alpaca Calendar API for exact session close times
            const firstBarDate = allBars[0].t.slice(0, 10);
            const lastBarDate = allBars[allBars.length - 1].t.slice(0, 10);
            // Fetch a bit beyond the last bar for weekly/monthly close lookups
            const paddedEnd = this._addDaysToDate(lastBarDate, 40);
            await this._ensureCalendar(firstBarDate, paddedEnd);

            return this._convertBarsStock(allBars, periodType, multiplier);
        } catch (error) {
            console.error('Error in AlpacaProvider.getMarketData:', error);
            return [];
        }
    }

    /**
     * Fetch all bars with automatic pagination.
     */
    private async _fetchAllBars(
        tickerId: string,
        alpacaTf: string,
        isCrypto: boolean,
        sDate?: number,
        eDate?: number,
        limit?: number,
    ): Promise<AlpacaBar[]> {
        const allBars: AlpacaBar[] = [];
        let pageToken: string | null = null;
        const maxBars = limit || Infinity;
        // Use the max page size to minimise round-trips
        const pageLimit = Math.min(limit || MAX_PAGE_LIMIT, MAX_PAGE_LIMIT);

        do {
            const url = this._buildBarsUrl(tickerId, alpacaTf, isCrypto, sDate, eDate, pageLimit, pageToken);
            const response = await fetch(url, { headers: this._headers() });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Alpaca HTTP ${response.status}: ${text}`);
            }

            const data: AlpacaBarsResponse = await response.json();

            // Alpaca wraps bars in { bars: { SYMBOL: [...] } }
            const symbolKey = Object.keys(data.bars || {})[0];
            if (!symbolKey || !data.bars[symbolKey]) break;

            allBars.push(...data.bars[symbolKey]);
            pageToken = data.next_page_token;

            // Stop if we have enough bars
            if (allBars.length >= maxBars) {
                break;
            }
        } while (pageToken);

        // Trim to exact limit
        if (limit && limit > 0 && allBars.length > limit) {
            return allBars.slice(0, limit);
        }

        return allBars;
    }

    /**
     * Build the bars URL for stocks or crypto.
     */
    private _buildBarsUrl(
        tickerId: string,
        alpacaTf: string,
        isCrypto: boolean,
        sDate?: number,
        eDate?: number,
        limit?: number,
        pageToken?: string | null,
    ): string {
        const base = isCrypto
            ? `${this._dataUrl}/v1beta3/crypto/us/bars`
            : `${this._dataUrl}/v2/stocks/bars`;

        const params = new URLSearchParams();
        params.set('symbols', tickerId);
        params.set('timeframe', alpacaTf);
        params.set('sort', 'asc');

        if (sDate) params.set('start', new Date(sDate).toISOString());
        if (eDate) params.set('end', new Date(eDate).toISOString());
        if (limit) params.set('limit', String(Math.min(limit, MAX_PAGE_LIMIT)));
        if (pageToken) params.set('page_token', pageToken);
        if (!isCrypto && this._feed) params.set('feed', this._feed);

        return `${base}?${params.toString()}`;
    }

    // ── Symbol Info ──────────────────────────────────────────────────────

    async getSymbolInfo(tickerId: string): Promise<ISymbolInfo> {
        this.ensureConfigured();

        try {
            const asset = await this._fetchAsset(tickerId);
            if (!asset) {
                console.error(`Alpaca: Symbol ${tickerId} not found`);
                return null;
            }

            const exchange = asset.exchange || '';
            const isCrypto = asset.class === 'crypto';
            const timezone = isCrypto ? 'Etc/UTC' : (EXCHANGE_TIMEZONE[exchange] || 'America/New_York');
            const session = isCrypto ? '24x7' : (EXCHANGE_SESSION[exchange] || '0930-1600');

            // Determine asset type
            let type = 'stock';
            if (isCrypto) type = 'crypto';

            // Derive currency from crypto symbol (e.g., BTC/USD → USD)
            const currency = isCrypto
                ? (tickerId.split('/')[1] || 'USD')
                : 'USD'; // Alpaca is US-only for equities

            // Base asset for crypto (e.g., BTC/USD → BTC)
            const baseCurrency = isCrypto
                ? (tickerId.split('/')[0] || tickerId)
                : currency;

            // Price precision from asset info
            const priceIncrement = asset.price_increment
                ? parseFloat(asset.price_increment)
                : 0.01;
            const pricescale = Math.round(1 / priceIncrement);

            const symbolInfo: ISymbolInfo = {
                // Symbol Identification
                ticker: asset.symbol,
                tickerid: `${exchange}:${asset.symbol}`,
                prefix: exchange,
                root: isCrypto ? tickerId.split('/')[0] : asset.symbol,
                description: asset.name || asset.symbol,
                type,
                main_tickerid: `${exchange}:${asset.symbol}`,
                current_contract: '',
                isin: '',

                // Currency & Location
                basecurrency: baseCurrency,
                currency,
                timezone,
                country: isCrypto ? '' : 'US',

                // Price & Contract Info
                mintick: priceIncrement,
                pricescale,
                minmove: 1,
                pointvalue: 1,
                mincontract: asset.min_order_size ? parseFloat(asset.min_order_size) : 0,

                // Session & Market
                session,
                volumetype: 'base',
                expiration_date: 0,

                // Company Data (not provided by Alpaca asset endpoint)
                employees: 0,
                industry: '',
                sector: '',
                shareholders: 0,
                shares_outstanding_float: 0,
                shares_outstanding_total: 0,

                // Analyst Ratings (not provided)
                recommendations_buy: 0,
                recommendations_buy_strong: 0,
                recommendations_date: 0,
                recommendations_hold: 0,
                recommendations_sell: 0,
                recommendations_sell_strong: 0,
                recommendations_total: 0,

                // Price Targets (not provided)
                target_price_average: 0,
                target_price_date: 0,
                target_price_estimates: 0,
                target_price_high: 0,
                target_price_low: 0,
                target_price_median: 0,
            };

            return symbolInfo;
        } catch (error) {
            console.error('Error in AlpacaProvider.getSymbolInfo:', error);
            return null;
        }
    }

    // ── Bar conversion ─────────────────────────────────────────────────

    /**
     * Convert bars for crypto (24/7 — no session boundaries).
     * closeTime = next bar's openTime, or openTime + period for last bar.
     */
    private _convertBarsCrypto(bars: AlpacaBar[], periodType: PeriodType, multiplier: number): Kline[] {
        return bars.map((bar, i, arr) => {
            const openTime = new Date(bar.t).getTime();
            const closeTime = (i < arr.length - 1)
                ? new Date(arr[i + 1].t).getTime()
                : computeNextPeriodStart(openTime, periodType, multiplier);
            return this._toKline(bar, openTime, closeTime);
        });
    }

    /**
     * Convert bars for stocks using the Alpaca trading calendar.
     * closeTime = exact session close from the calendar (handles early closes, DST).
     */
    private _convertBarsStock(bars: AlpacaBar[], periodType: PeriodType, multiplier: number): Kline[] {
        const TZ = 'America/New_York'; // All Alpaca US equity exchanges

        return bars.map((bar) => {
            const openTime = new Date(bar.t).getTime();
            const barDate = bar.t.slice(0, 10); // "YYYY-MM-DD"

            let closeTime: number;

            if (periodType === 'day') {
                // Daily: session close on the bar's date
                const cal = this._calendarCache.get(barDate);
                const closeStr = cal ? cal.close : '16:00';
                closeTime = localTimeToUTC(barDate, closeStr, TZ);
            } else if (periodType === 'minute' || periodType === 'hour') {
                // Intraday: min(openTime + barDuration, session close on that day)
                const MS_PER_UNIT: Record<string, number> = { minute: 60_000, hour: 3_600_000 };
                const barEndMs = openTime + multiplier * MS_PER_UNIT[periodType];
                const cal = this._calendarCache.get(barDate);
                const closeStr = cal ? cal.close : '16:00';
                const sessionEndMs = localTimeToUTC(barDate, closeStr, TZ);
                closeTime = Math.min(barEndMs, sessionEndMs);
            } else if (periodType === 'week') {
                // Weekly: find the last trading day in that week from the calendar
                closeTime = this._weeklyCloseFromCalendar(barDate, TZ);
            } else if (periodType === 'month') {
                // Monthly: find the last trading day of the month from the calendar
                closeTime = this._monthlyCloseFromCalendar(barDate, TZ);
            } else {
                closeTime = computeNextPeriodStart(openTime, periodType, multiplier);
            }

            return this._toKline(bar, openTime, closeTime);
        });
    }

    /** Build a Kline from an AlpacaBar + computed times. */
    private _toKline(bar: AlpacaBar, openTime: number, closeTime: number): Kline {
        return {
            openTime,
            open: bar.o,
            high: bar.h,
            low: bar.l,
            close: bar.c,
            volume: bar.v,
            closeTime,
            quoteAssetVolume: 0,
            numberOfTrades: bar.n,
            takerBuyBaseAssetVolume: 0,
            takerBuyQuoteAssetVolume: 0,
            ignore: 0,
        };
    }

    /**
     * Find the last trading day of the week containing `barDate` and return
     * its session close time in UTC ms.
     */
    private _weeklyCloseFromCalendar(barDate: string, timezone: string): number {
        const d = new Date(barDate + 'T00:00:00Z');
        const dayOfWeek = d.getUTCDay(); // 0=Sun..6=Sat
        // Go to end of week (Friday = day 5). If on Saturday, next Friday is +6 days ahead.
        const fridayOffset = dayOfWeek <= 5 ? (5 - dayOfWeek) : (5 - dayOfWeek + 7);
        // Search backward from Friday to find the last actual trading day
        for (let offset = fridayOffset; offset >= 0; offset--) {
            const checkMs = d.getTime() + offset * 86_400_000;
            const checkDate = new Date(checkMs).toISOString().split('T')[0];
            const cal = this._calendarCache.get(checkDate);
            if (cal) {
                return localTimeToUTC(checkDate, cal.close, timezone);
            }
        }
        // Fallback: Friday at 16:00 ET
        const fridayMs = d.getTime() + fridayOffset * 86_400_000;
        const fridayDate = new Date(fridayMs).toISOString().split('T')[0];
        return localTimeToUTC(fridayDate, '16:00', timezone);
    }

    /**
     * Find the last trading day of the month containing `barDate` and return
     * its session close time in UTC ms.
     */
    private _monthlyCloseFromCalendar(barDate: string, timezone: string): number {
        const [year, month] = barDate.split('-').map(Number);
        // Last day of the month
        const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate(); // month is 1-based here, Date.UTC(y, m, 0) = last day of m-1+1
        // Search backward from last day of month
        for (let day = lastDay; day >= 1; day--) {
            const checkDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const cal = this._calendarCache.get(checkDate);
            if (cal) {
                return localTimeToUTC(checkDate, cal.close, timezone);
            }
        }
        // Fallback: last weekday of month at 16:00
        const lastDate = new Date(Date.UTC(year, month, 0));
        while (lastDate.getUTCDay() === 0 || lastDate.getUTCDay() === 6) {
            lastDate.setUTCDate(lastDate.getUTCDate() - 1);
        }
        return localTimeToUTC(lastDate.toISOString().split('T')[0], '16:00', timezone);
    }

    // ── Calendar API ────────────────────────────────────────────────────

    /**
     * Ensure the calendar cache covers the given date range.
     * Fetches from Alpaca's `GET /v2/calendar` endpoint, which returns
     * per-day trading hours including early closes (data from 1970-2029).
     */
    private async _ensureCalendar(startDate: string, endDate: string): Promise<void> {
        // Check if we already have data for this range
        if (this._calendarCache.has(startDate) && this._calendarCache.has(endDate)) {
            return; // Likely already fetched
        }

        const url = `${this._tradingUrl}/calendar?start=${startDate}&end=${endDate}`;
        const response = await fetch(url, { headers: this._headers() });
        if (!response.ok) {
            console.warn(`Alpaca calendar API returned ${response.status}, falling back to defaults`);
            return;
        }

        const days: AlpacaCalendarDay[] = await response.json();
        for (const day of days) {
            this._calendarCache.set(day.date, day);
        }
    }

    // ── Private helpers ──────────────────────────────────────────────────

    private async _fetchAsset(tickerId: string): Promise<AlpacaAsset | null> {
        if (this._assetCache.has(tickerId)) {
            return this._assetCache.get(tickerId)!;
        }

        const encodedSymbol = encodeURIComponent(tickerId);
        const url = `${this._tradingUrl}/assets/${encodedSymbol}`;
        const response = await fetch(url, { headers: this._headers() });
        if (!response.ok) return null;

        const asset: AlpacaAsset = await response.json();
        this._assetCache.set(tickerId, asset);
        return asset;
    }

    /**
     * Parse an Alpaca timeframe string (e.g., '1Min', '4Hour', '1Month')
     * into a PeriodType and multiplier for calendar-aware date math.
     */
    private _parseAlpacaTimeframe(alpacaTf: string): { periodType: PeriodType; multiplier: number } {
        const match = alpacaTf.match(/^(\d+)(Min|Hour|Day|Week|Month)$/);
        if (match) {
            const multiplier = parseInt(match[1], 10);
            const periodType = ALPACA_UNIT_TO_PERIOD[match[2]];
            if (periodType) return { periodType, multiplier };
        }
        return { periodType: 'day', multiplier: 1 };
    }

    /** Resolve PineTS timeframe to Alpaca timeframe string. */
    private _resolveTimeframe(timeframe: string): string | null {
        return TIMEFRAME_TO_ALPACA[timeframe.toUpperCase()]
            || TIMEFRAME_TO_ALPACA[timeframe]
            || null;
    }

    /** Heuristic: crypto tickers contain '/'. */
    private _isCrypto(tickerId: string): boolean {
        return tickerId.includes('/');
    }

    /** Add N days to a "YYYY-MM-DD" date string. */
    private _addDaysToDate(dateStr: string, days: number): string {
        const d = new Date(dateStr + 'T00:00:00Z');
        d.setUTCDate(d.getUTCDate() + days);
        return d.toISOString().split('T')[0];
    }
}
