// SPDX-License-Identifier: AGPL-3.0-only

import { IProvider, ISymbolInfo, BaseProviderConfig } from './IProvider';
import { Kline, normalizeCloseTime } from './types';
import { selectSubTimeframe, aggregateCandles, getAggregationRatio } from './aggregation';

/**
 * Normalize a user-supplied timeframe key to the canonical form used
 * by `getSupportedTimeframes()` and `TIMEFRAME_SECONDS`.
 *
 * Canonical forms: seconds as 'NS', minutes as plain integers,
 * calendar periods as D/W/M.
 */
const TF_NORMALIZE: Record<string, string> = {
    // Lowercase / Binance-style aliases
    '1s': '1S', '5s': '5S', '10s': '10S', '15s': '15S', '30s': '30S',
    '1m': '1', '3m': '3', '5m': '5', '15m': '15', '30m': '30', '45m': '45',
    '1h': '60', '2h': '120', '3h': '180', '4h': '240',
    '1d': 'D', '1w': 'W',
    // Uppercase aliases
    '1D': 'D', '1W': 'W', '1M': 'M', '4H': '240',
    // Pass-through canonical keys
    'D': 'D', 'W': 'W', 'M': 'M',
};

function normalizeTimeframeKey(timeframe: string): string {
    // Direct match (case-sensitive for '1M' vs '1m')
    if (TF_NORMALIZE[timeframe] !== undefined) return TF_NORMALIZE[timeframe];
    // Try lowercase
    const lower = timeframe.toLowerCase();
    if (TF_NORMALIZE[lower] !== undefined) return TF_NORMALIZE[lower];
    // Already a canonical number ('1', '60', '240', etc.)
    if (/^\d+$/.test(timeframe)) return timeframe;
    // Second-based ('30S', etc.)
    if (/^\d+S$/i.test(timeframe)) return timeframe.toUpperCase();
    return timeframe;
}

/**
 * Abstract base class for market data providers.
 *
 * Provides shared logic: closeTime normalization, fail-early API key
 * validation, and **automatic candle aggregation** for unsupported
 * timeframes.
 *
 * ## Aggregation
 *
 * When a provider doesn't natively support a timeframe, `getMarketData()`
 * automatically:
 * 1. Selects the best sub-timeframe the provider supports
 * 2. Fetches sub-candles via `_getMarketDataNative()`
 * 3. Aggregates them into the requested timeframe
 *
 * Providers declare native support via `getSupportedTimeframes()` and
 * implement `_getMarketDataNative()` for the actual API call.
 *
 * ## Usage
 *
 * ```typescript
 * class MyProvider extends BaseProvider<MyConfig> {
 *     protected getSupportedTimeframes() {
 *         return new Set(['1', '5', '15', '60', 'D']);
 *     }
 *     protected async _getMarketDataNative(...) { ... }
 * }
 * ```
 */
export abstract class BaseProvider<TConfig extends BaseProviderConfig = BaseProviderConfig> implements IProvider {
    private _configured: boolean;
    private _requiresApiKey: boolean;
    private _providerName: string;
    private _aggregationSubTimeframe: string | null = null;

    constructor(options: { requiresApiKey: boolean; providerName: string }) {
        this._requiresApiKey = options.requiresApiKey;
        this._providerName = options.providerName;
        this._configured = !options.requiresApiKey;
    }

    /**
     * Fail-early check — call at the top of `_getMarketDataNative()` / `getSymbolInfo()`
     * in providers that require an API key.
     */
    protected ensureConfigured(): void {
        if (!this._configured) {
            throw new Error(
                `${this._providerName} requires configuration before use. ` +
                `Call Provider.${this._providerName}.configure({ apiKey: '...' }) ` +
                `or instantiate directly: new ${this._providerName}Provider({ apiKey: '...' })`
            );
        }
    }

    /**
     * Base configure — marks the provider as configured.
     * Subclasses override to store their specific config, and must call `super.configure(config)`.
     */
    configure(config: TConfig): void {
        this._configured = true;
    }

    /** Whether this provider has been configured (always true for keyless providers). */
    get isConfigured(): boolean {
        return this._configured;
    }

    /**
     * Shared closeTime normalization utility.
     * Delegates to the standalone `normalizeCloseTime()` from `types.ts`.
     */
    protected normalizeCloseTime(data: Kline[]): void {
        normalizeCloseTime(data);
    }

    /**
     * Override the sub-timeframe used for aggregation.
     * When set, this timeframe is used instead of auto-selecting the best divisor.
     * Set to `null` to re-enable automatic selection.
     */
    setAggregationSubTimeframe(subTimeframe: string | null): void {
        this._aggregationSubTimeframe = subTimeframe;
    }

    // ── Timeframe support ───────────────────────────────────────────────

    /**
     * Return the set of timeframes this provider supports natively.
     *
     * Override in subclasses. Default: all canonical timeframes (no aggregation).
     * Use canonical keys: '1','3','5','15','30','45','60','120','180','240','D','W','M'
     * and optionally second-based: '1S','5S','10S','15S','30S'.
     */
    protected getSupportedTimeframes(): Set<string> {
        return new Set([
            '1S', '5S', '10S', '15S', '30S',
            '1', '3', '5', '15', '30', '45', '60', '120', '180', '240',
            'D', 'W', 'M',
        ]);
    }

    // ── Market data orchestrator ────────────────────────────────────────

    /**
     * Fetch market data — delegates to native fetch or aggregates from sub-candles.
     *
     * 1. If the timeframe is natively supported, delegates to `_getMarketDataNative()`.
     * 2. Otherwise, selects the best sub-timeframe, fetches sub-candles, and aggregates.
     */
    async getMarketData(
        tickerId: string,
        timeframe: string,
        limit?: number,
        sDate?: number,
        eDate?: number,
    ): Promise<Kline[]> {
        const normalizedTf = normalizeTimeframeKey(timeframe);
        const supported = this.getSupportedTimeframes();

        // Fast path: natively supported
        if (supported.has(normalizedTf)) {
            return this._getMarketDataNative(tickerId, normalizedTf, limit, sDate, eDate);
        }

        // Aggregation path
        const forcedSub = this._aggregationSubTimeframe;
        const subTimeframe = (forcedSub && supported.has(forcedSub))
            ? forcedSub
            : selectSubTimeframe(normalizedTf, supported);

        if (!subTimeframe) {
            console.error(
                `${this._providerName}: Timeframe '${timeframe}' is not supported ` +
                `and no valid sub-timeframe found for aggregation.`,
            );
            return [];
        }

        // Inflate limit to account for aggregation ratio
        const subLimit = this._computeSubLimit(normalizedTf, subTimeframe, limit);

        // Fetch sub-candles
        const subCandles = await this._getMarketDataNative(
            tickerId, subTimeframe, subLimit, sDate, eDate,
        );

        if (subCandles.length === 0) return [];

        // Aggregate
        const aggregated = aggregateCandles(subCandles, normalizedTf, subTimeframe);

        // Apply limit to the aggregated result
        if (limit && limit > 0 && aggregated.length > limit) {
            return aggregated.slice(aggregated.length - limit);
        }

        return aggregated;
    }

    // ── Abstract methods for subclasses ─────────────────────────────────

    /**
     * Fetch market data natively from the provider's API.
     *
     * Subclasses MUST implement this. It is called by the BaseProvider
     * orchestrator either for the requested timeframe (if natively supported)
     * or for a sub-candle timeframe (if aggregation is needed).
     */
    protected abstract _getMarketDataNative(
        tickerId: string,
        timeframe: string,
        limit?: number,
        sDate?: number,
        eDate?: number,
    ): Promise<Kline[]>;

    abstract getSymbolInfo(tickerId: string): Promise<ISymbolInfo>;

    // ── Private helpers ─────────────────────────────────────────────────

    /**
     * Compute how many sub-candles to fetch to produce `limit` aggregated candles.
     */
    private _computeSubLimit(
        targetTf: string,
        subTf: string,
        limit?: number,
    ): number | undefined {
        if (!limit) return undefined; // No limit → fetch all

        const ratio = getAggregationRatio(targetTf, subTf);
        if (ratio === Infinity) {
            // Calendar-based: generous estimate
            if (targetTf === 'W') return limit * 7 + 14;
            if (targetTf === 'M') return limit * 31 + 31;
            return limit * 30;
        }

        // Fixed ratio + small buffer for alignment edge cases
        return Math.ceil(limit * ratio) + Math.ceil(ratio);
    }
}
