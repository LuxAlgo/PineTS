// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI
import { transpile } from '@pinets/transpiler/index';
import { IProvider, ISymbolInfo } from './marketData/IProvider';
import { Context } from './Context.class';
import { Series } from './Series';
import { Indicator } from './Indicator';

// ── Timeframe duration utility ──────────────────────────────────────
//prettier-ignore
const TIMEFRAME_DURATION_MS: Record<string, number> = {
    '1': 60_000, '3': 180_000, '5': 300_000, '15': 900_000, '30': 1_800_000,
    '60': 3_600_000, '120': 7_200_000, '180': 10_800_000, '240': 14_400_000,
    '4H': 14_400_000, '1D': 86_400_000, 'D': 86_400_000,
    '1W': 604_800_000, 'W': 604_800_000,
    '1M': 30 * 86_400_000, 'M': 30 * 86_400_000,
};
function getTimeframeDurationMs(timeframe: string | undefined): number {
    if (!timeframe) return 86_400_000; // default to 1D when timeframe is unknown
    return TIMEFRAME_DURATION_MS[timeframe] ?? TIMEFRAME_DURATION_MS[timeframe.toUpperCase()] ?? 86_400_000;
}

/**
 * This class is a wrapper for the Pine Script language, it allows to run Pine Script code in a JavaScript environment
 */
export class PineTS {
    public data: any = [];

    //#region [Pine Script built-in variables]
    public open: any = [];
    public high: any = [];
    public low: any = [];
    public close: any = [];
    public volume: any = [];
    public hl2: any = [];
    public hlc3: any = [];
    public ohlc4: any = [];
    public hlcc4: any = [];
    public openTime: any = [];
    public closeTime: any = [];
    //#endregion

    //#region run context
    // private _periods: number = undefined;
    // public get periods() {
    //     return this._periods;
    // }
    //#endregion

    //public fn: Function;

    private _readyPromise: Promise<any> = null;

    private _ready = false;

    private _debugSettings = {
        ln: false,
        debug: false,
    };

    private _transpiledCode: Function | String = null;
    public get transpiledCode() {
        return this._transpiledCode;
    }

    private _isSecondaryContext: boolean = false;
    public markAsSecondary() {
        this._isSecondaryContext = true;
    }

    private _syminfo: ISymbolInfo;
    private _chartTimezone: string | null = null;

    /**
     * Set the chart display timezone (like TradingView's timezone picker).
     * This only affects log timestamp formatting — it does NOT change the timezone
     * used by computation functions (timestamp(), dayofmonth, hour, etc.), which
     * always use the exchange timezone from syminfo.timezone.
     * @param timezone IANA timezone name (e.g. 'America/New_York'), UTC offset ('UTC+5'), or 'UTC'
     */
    public setTimezone(timezone: string) {
        this._chartTimezone = timezone;
    }

    private _maxLoops: number = 500000;

    /**
     * Set the maximum number of iterations allowed per loop.
     * Mirrors TradingView's internal loop protection. If a for/while loop
     * exceeds this limit, a runtime error is thrown.
     * @param maxLoops Maximum iterations per loop (default: 500000)
     */
    public setMaxLoops(maxLoops: number) {
        this._maxLoops = maxLoops;
    }

    constructor(
        private source: IProvider | any[],
        private tickerId?: string,
        private timeframe?: string,
        private limit?: number,
        private sDate?: number,
        private eDate?: number,
    ) {
        this._readyPromise = new Promise((resolve) => {
            this.loadMarketData(source, tickerId, timeframe, limit, sDate, eDate).then((data) => {
                const marketData = data;

                //this._periods = marketData.length;
                this.data = marketData;

                const _open = marketData.map((d) => d.open);
                const _close = marketData.map((d) => d.close);
                const _high = marketData.map((d) => d.high);
                const _low = marketData.map((d) => d.low);
                const _volume = marketData.map((d) => d.volume);
                const _hlc3 = marketData.map((d) => (d.high + d.low + d.close) / 3);
                const _hl2 = marketData.map((d) => (d.high + d.low) / 2);
                const _ohlc4 = marketData.map((d) => (d.high + d.low + d.open + d.close) / 4);
                const _hlcc4 = marketData.map((d) => (d.high + d.low + d.close + d.close) / 4);
                const _openTime = marketData.map((d) => d.openTime);
                // Providers should supply closeTime as session close time (TV convention).
                // Safety-net for array-based data or providers that omit closeTime:
                // estimate as openTime + timeframe duration (accurate for 24/7 crypto).
                const tfDurationMs = getTimeframeDurationMs(this.timeframe);
                const _closeTime = marketData.map((d) =>
                    d.closeTime != null ? d.closeTime : d.openTime + tfDurationMs
                );

                this.open = _open;
                this.close = _close;
                this.high = _high;
                this.low = _low;
                this.volume = _volume;
                this.hl2 = _hl2;
                this.hlc3 = _hlc3;
                this.ohlc4 = _ohlc4;
                this.hlcc4 = _hlcc4;
                this.openTime = _openTime;
                this.closeTime = _closeTime;

                if (source && (source as IProvider).getSymbolInfo) {
                    const symbolInfo = (source as IProvider)
                        .getSymbolInfo(tickerId)
                        .then((symbolInfo) => {
                            this._syminfo = symbolInfo;
                            this._ready = true;
                            resolve(true);
                        })
                        .catch((error) => {
                            console.warn('Failed to get symbol info, using default values:', error);
                            this._ready = true;
                            resolve(true);
                        });
                } else {
                    this._ready = true;
                    resolve(true);
                }
            });
        });
    }

    public setDebugSettings({ ln, debug }: { ln: boolean; debug: boolean }) {
        this._debugSettings.ln = ln;
        this._debugSettings.debug = debug;
    }

    private async loadMarketData(source: IProvider | any[], tickerId: string, timeframe: string, limit?: number, sDate?: number, eDate?: number) {
        if (Array.isArray(source)) {
            return source;
        } else {
            return (source as IProvider).getMarketData(tickerId, timeframe, limit, sDate, eDate);
        }
    }

    public async ready() {
        if (this._ready) return true;
        if (!this._readyPromise) throw new Error('PineTS is not ready');
        return this._readyPromise;
    }

    /**
     * Run the Pine Script code and return the resulting context.
     * @param pineTSCode
     * @param periods
     * @returns Promise<Context>
     */
    public run(pineTSCode: Indicator | Function | String, periods?: number): Promise<Context>;
    /**
     * Run the Pine Script code with pagination, yielding results page by page.
     * @param pineTSCode
     * @param periods
     * @param pageSize
     * @returns AsyncGenerator<Context>
     */
    public run(pineTSCode: Indicator | Function | String, periods: number | undefined, pageSize: number): AsyncGenerator<Context>;
    /**
     * Run the Pine Script code and return the resulting context.
     * if pageSize is provided, the function will return an iterator that will yield the results page by page.
     * each page contains the results of "pageSize" periods.
     * @param pineTSCode
     * @param periods
     * @param pageSize
     * @returns Context if pageSize is 0 or undefined, or AsyncGenerator<Context> if pageSize > 0
     */
    public run(pineTSCode: Indicator | Function | String, periods?: number, pageSize?: number): Promise<Context> | AsyncGenerator<Context> {
        let code: Function | String;
        let inputs: Record<string, any> = {};

        if (pineTSCode instanceof Indicator) {
            code = pineTSCode.source;
            inputs = pineTSCode.inputs || {};
        } else {
            code = pineTSCode;
        }

        if (pageSize && pageSize > 0) {
            // livemode is enabled if eDate is undefined and we're using a provider as a source
            const enableLiveStream = typeof this.eDate === 'undefined' && !Array.isArray(this.source);
            return this._runPaginated(code, inputs, periods, pageSize, enableLiveStream);
        } else {
            return this._runComplete(code, inputs, periods);
        }
    }

    /**
     * Stream the results of the Pine Script code.
     * Provides an event-based interface for handling streaming data.
     * @param pineTSCode The Pine Script code to execute
     * @param options Streaming options
     * @returns Object with on(event, callback) and stop() methods
     */
    public stream(
        pineTSCode: Indicator | Function | String,
        options: { pageSize?: number; live?: boolean; interval?: number } = {},
    ): { on: (event: 'data' | 'error', callback: Function) => void; stop: () => void } {
        const { live = true, interval = 1000 } = options;
        const pageSize = options.pageSize || this.data.length; // Default pageSize to full data if not provided

        let code: Function | String;
        let inputs: Record<string, any> = {};

        if (pineTSCode instanceof Indicator) {
            code = pineTSCode.source;
            inputs = pineTSCode.inputs || {};
        } else {
            code = pineTSCode;
        }

        const listeners: { [key: string]: Function[] } = { data: [], error: [] };
        let stopped = false;

        const emit = (event: string, ...args: any[]) => {
            if (listeners[event]) {
                listeners[event].forEach((cb) => cb(...args));
            }
        };

        const on = (event: 'data' | 'error', callback: Function) => {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(callback);
        };

        const stop = () => {
            stopped = true;
        };

        // Start execution
        (async () => {
            try {
                // Determine if live streaming is possible and requested
                const isLiveCapable = typeof this.eDate === 'undefined' && !Array.isArray(this.source);
                const enableLiveStream = isLiveCapable && live;

                // Pass undefined for periods to include all data
                // We use the generator version directly to control enableLiveStream
                const iterator = this._runPaginated(code, inputs, undefined, pageSize, enableLiveStream);

                for await (const ctx of iterator) {
                    if (stopped) break;

                    if (ctx === null) {
                        // No new data
                        // This block is only reached if enableLiveStream is true and provider yields no data

                        // Wait and retry
                        await new Promise((resolve) => setTimeout(resolve, interval));
                        continue;
                    }

                    emit('data', ctx);

                    // If live streaming is enabled, wait for the interval before fetching next data
                    // This prevents hammering the API when new data is available immediately or in rapid succession
                    if (enableLiveStream && !stopped) {
                        const currentCandle = ctx.marketData[ctx.idx];
                        const isHistorical = currentCandle && currentCandle.closeTime < Date.now();

                        if (!isHistorical) {
                            await new Promise((resolve) => setTimeout(resolve, interval));
                        }
                    }
                }
            } catch (error) {
                emit('error', error);
            }
        })();

        return { on, stop };
    }

    /**
     * Run the script completely and return the final context (backward compatible behavior)
     * @private
     */
    private async _runComplete(pineTSCode: Function | String, inputs: Record<string, any>, periods?: number): Promise<Context> {
        await this.ready();
        if (!periods) periods = this.data.length;

        const context = this._initializeContext(pineTSCode, inputs, this._isSecondaryContext);
        this._transpiledCode = this._transpileCode(pineTSCode);

        await this._executeIterations(context, this._transpiledCode, this.data.length - periods, this.data.length);

        return context;
    }

    /**
     * Run the script with pagination, yielding results page by page
     * Each page contains only the new results for that page, not cumulative results
     * Uses a unified loop that handles both historical and live streaming data
     * @private
     */
    private async *_runPaginated(
        pineTSCode: Function | String,
        inputs: Record<string, any>,
        periods: number | undefined,
        pageSize: number,
        enableLiveStream: boolean = false,
    ): AsyncGenerator<Context> {
        await this.ready();
        if (!periods) periods = this.data.length;

        const context = this._initializeContext(pineTSCode, inputs, this._isSecondaryContext);
        this._transpiledCode = this._transpileCode(pineTSCode);

        const startIdx = this.data.length - periods;
        let processedUpToIdx = startIdx; // Track what we've fully processed

        // Unified loop handles both historical and live data
        while (true) {
            const availableData = this.data.length;
            const unprocessedCount = availableData - processedUpToIdx;

            // #1: If we have unprocessed data, process it
            if (unprocessedCount > 0) {
                const toProcess = Math.min(unprocessedCount, pageSize);
                const previousResultLength = this._getResultLength(context.result);

                await this._executeIterations(context, this._transpiledCode, processedUpToIdx, processedUpToIdx + toProcess);

                processedUpToIdx += toProcess;

                // Yield the page with new results
                const pageContext = this._createPageContext(context, previousResultLength);
                yield pageContext;
                continue;
            }

            // #2: Caught up to current data (processedUpToIdx === this.data.length)

            // If not live streaming, we're done
            if (!enableLiveStream || Array.isArray(this.source)) {
                break;
            }

            // #3: Fetch new data, always starting from last candle's openTime
            const { newCandles, updatedLastCandle } = await this._updateMarketData();

            if (newCandles === 0 && !updatedLastCandle) {
                // No new data available, yield null to signal caller
                yield null as any;
                continue;
            }

            // #4: Data changed — bump version so secondary contexts know to refresh
            context.dataVersion++;

            // Update context.length so barstate.islast (which checks
            // context.idx === context.length - 1) works correctly for new bars.
            // Without this, barstate.islast stays false after new candles arrive,
            // and any `if barstate.islast` drawing logic never executes.
            context.length = this.data.length;

            // Always recalculate last candle + new ones
            // Remove last result (will be recalculated with fresh data)
            this._removeLastResult(context);

            // Step back one position to reprocess last candle
            processedUpToIdx = this.data.length - (newCandles + 1);

            // Roll back drawing objects created during the previous processing of
            // these bars so they don't accumulate on each streaming tick.
            context.rollbackDrawings(processedUpToIdx);

            // Next iteration of loop will process from updated position (#1)

            //barstate.isnew becomes false on live bars
            context.pine.barstate.setLive();
        }
    }

    /**
     * Get the length of the result (works for arrays and objects)
     * @private
     */
    private _getResultLength(result: any): number {
        if (Array.isArray(result)) {
            return result.length;
        } else if (typeof result === 'object' && result !== null) {
            const keys = Object.keys(result);
            if (keys.length > 0 && Array.isArray(result[keys[0]])) {
                return result[keys[0]].length;
            }
        }
        return 0;
    }

    /**
     * Create a context containing only the new results for the current page
     * @private
     */
    private _createPageContext(fullContext: Context, previousResultLength: number): Context {
        // console.log('_createPageContext fullContext.inputs keys:', fullContext.inputs ? Object.keys(fullContext.inputs) : 'undefined');
        const pageContext = new Context({
            marketData: this.data,
            source: this.source,
            tickerId: this.tickerId,
            timeframe: this.timeframe,
            limit: this.limit,
            sDate: this.sDate,
            eDate: this.eDate,
            fullContext,
            inputs: fullContext.inputs,
        });

        pageContext.pineTSCode = fullContext.pineTSCode;
        pageContext.idx = fullContext.idx;

        // Copy only the new results for this page
        if (Array.isArray(fullContext.result)) {
            pageContext.result = fullContext.result.slice(previousResultLength);
        } else if (typeof fullContext.result === 'object' && fullContext.result !== null) {
            pageContext.result = {};
            for (let key in fullContext.result) {
                if (Array.isArray(fullContext.result[key])) {
                    pageContext.result[key] = fullContext.result[key].slice(previousResultLength);
                } else {
                    pageContext.result[key] = fullContext.result[key];
                }
            }
        } else {
            pageContext.result = fullContext.result;
        }

        // Copy plots metadata
        pageContext.plots = { ...fullContext.plots };

        return pageContext;
    }

    /**
     * Update market data from the last known candle to now (or eDate if provided)
     * Intelligently replaces the last candle if it's still open, or appends new candles
     * @param eDate - Optional end date, defaults to now
     * @returns Object containing: { newCandles: number, updatedLastCandle: boolean }
     * @private
     */
    private async _updateMarketData(eDate?: number): Promise<{ newCandles: number; updatedLastCandle: boolean }> {
        // Can only update if source is a Provider
        if (Array.isArray(this.source)) {
            return { newCandles: 0, updatedLastCandle: false };
        }

        const provider = this.source as IProvider;
        const lastCandleIdx = this.data.length - 1;
        const lastCandle = this.data[lastCandleIdx];
        const lastCandleOpenTime = lastCandle.openTime;

        try {
            // Fetch new data starting from the last candle's open time
            const newData = await provider.getMarketData(this.tickerId!, this.timeframe!, undefined, lastCandleOpenTime, eDate);

            if (!newData || newData.length === 0) {
                return { newCandles: 0, updatedLastCandle: false };
            }

            let updatedLastCandle = false;
            let newCandles = 0;

            // Process the fetched data
            for (let i = 0; i < newData.length; i++) {
                const candle = newData[i];

                // Check if this candle is an update to our last candle
                if (candle.openTime === lastCandleOpenTime) {
                    // Update the existing last candle
                    this._replaceCandle(lastCandleIdx, candle);
                    updatedLastCandle = true;
                } else if (candle.openTime > lastCandleOpenTime) {
                    // This is a new candle, append it
                    this._appendCandle(candle);
                    newCandles++;
                }
                // Skip candles with openTime < lastCandleOpenTime (shouldn't happen)
            }

            return { newCandles, updatedLastCandle };
        } catch (error) {
            console.error('Error updating market data:', error);
            return { newCandles: 0, updatedLastCandle: false };
        }
    }

    /**
     * Replace a candle at a specific index with new data
     * @private
     */
    private _replaceCandle(index: number, candle: any): void {
        this.data[index] = candle;
        this.open[index] = candle.open;
        this.close[index] = candle.close;
        this.high[index] = candle.high;
        this.low[index] = candle.low;
        this.volume[index] = candle.volume;
        this.hl2[index] = (candle.high + candle.low) / 2;
        this.hlc3[index] = (candle.high + candle.low + candle.close) / 3;
        this.ohlc4[index] = (candle.high + candle.low + candle.open + candle.close) / 4;
        this.hlcc4[index] = (candle.high + candle.low + candle.close + candle.close) / 4;
        this.openTime[index] = candle.openTime;
        this.closeTime[index] = candle.closeTime;
    }

    /**
     * Append a new candle to the end of market data arrays
     * @private
     */
    private _appendCandle(candle: any): void {
        this.data.push(candle);
        this.open.push(candle.open);
        this.close.push(candle.close);
        this.high.push(candle.high);
        this.low.push(candle.low);
        this.volume.push(candle.volume);
        this.hl2.push((candle.high + candle.low) / 2);
        this.hlc3.push((candle.high + candle.low + candle.close) / 3);
        this.ohlc4.push((candle.high + candle.low + candle.open + candle.close) / 4);
        this.hlcc4.push((candle.high + candle.low + candle.close + candle.close) / 4);
        this.openTime.push(candle.openTime);
        this.closeTime.push(candle.closeTime);
    }

    /**
     * Update the secondary context's tail with fresh market data.
     * Mirrors the streaming update logic in _runPaginated:
     * fetches new/updated candles, rolls back the last result, and re-executes
     * only the affected bars.
     * @param context - The cached secondary context to update
     * @returns true if data was updated, false if no changes
     */
    public async updateTail(context: Context): Promise<boolean> {
        // Guard: skip if no data (e.g. secondary context failed to load from provider)
        if (this.data.length === 0 || Array.isArray(this.source)) return false;

        const { newCandles, updatedLastCandle } = await this._updateMarketData();
        if (newCandles === 0 && !updatedLastCandle) return false;

        this._removeLastResult(context);
        context.length = this.data.length;
        const processFrom = this.data.length - (newCandles + 1);
        context.rollbackDrawings(processFrom);
        await this._executeIterations(context, this._transpiledCode as Function, processFrom, this.data.length);
        return true;
    }

    /**
     * Remove the last result from context (for updating an open candle)
     * @private
     */
    private _removeLastResult(context: Context): void {
        if (Array.isArray(context.result)) {
            context.result.pop();
        } else if (typeof context.result === 'object' && context.result !== null) {
            for (let key in context.result) {
                if (Array.isArray(context.result[key])) {
                    context.result[key].pop();
                }
            }
        }

        // Also remove from context.data arrays (last element = most recent in forward array)
        context.data.close.data.pop();
        context.data.open.data.pop();
        context.data.high.data.pop();
        context.data.low.data.pop();
        context.data.volume.data.pop();
        context.data.hl2.data.pop();
        context.data.hlc3.data.pop();
        context.data.ohlc4.data.pop();
        context.data.hlcc4.data.pop();
        context.data.openTime.data.pop();
        if (context.data.closeTime) {
            context.data.closeTime.data.pop();
        }
        context.data.bar_index.data.pop();

        // Fix: Rollback context variables (let, var, const, params)
        const contextVarNames = ['const', 'var', 'let', 'params'];
        const rollbackVariables = (container: any) => {
            for (let ctxVarName of contextVarNames) {
                if (!container[ctxVarName]) continue;
                for (let key in container[ctxVarName]) {
                    const item = container[ctxVarName][key];
                    if (item instanceof Series) {
                        item.data.pop();
                    } else if (Array.isArray(item)) {
                        item.pop();
                    }
                }
            }
        };

        rollbackVariables(context);
        if (context.lctx) {
            context.lctx.forEach((lctx: any) => rollbackVariables(lctx));
        }
    }

    /**
     * Initialize a new context for running Pine Script code
     * @private
     */
    private _initializeContext(pineTSCode: Function | String, inputs: Record<string, any> = {}, isSecondary: boolean = false): Context {
        const context = new Context({
            marketData: this.data,
            source: this.source,
            tickerId: this.tickerId,
            timeframe: this.timeframe,
            limit: this.limit,
            sDate: this.sDate,
            eDate: this.eDate,
            inputs,
        });

        context.pine.syminfo = this._syminfo;
        // Chart timezone only affects display formatting (log timestamps).
        // It does NOT override syminfo.timezone, which drives computation
        // (timestamp(), hour, dayofmonth, time_tradingday, etc.).
        if (this._chartTimezone) {
            context.chartTimezone = this._chartTimezone;
        }

        context.__maxLoops = this._maxLoops;

        context.pineTSCode = pineTSCode;
        context.isSecondaryContext = isSecondary; // Set secondary context flag
        context.data.close = new Series([]);
        context.data.open = new Series([]);
        context.data.high = new Series([]);
        context.data.low = new Series([]);
        context.data.volume = new Series([]);
        context.data.hl2 = new Series([]);
        context.data.hlc3 = new Series([]);
        context.data.ohlc4 = new Series([]);
        context.data.hlcc4 = new Series([]);
        context.data.openTime = new Series([]);
        context.data.closeTime = new Series([]);

        context.length = this.data.length;

        return context;
    }

    /**
     * Transpile the Pine Script code
     * @private
     */
    private _transpileCode(pineTSCode: Function | String): Function {
        const transformer = transpile.bind(this);
        return transformer(pineTSCode, this._debugSettings);
    }

    /**
     * Execute iterations from startIdx to endIdx, updating the context
     * @private
     */
    private async _executeIterations(context: Context, transpiledFn: Function, startIdx: number, endIdx: number): Promise<void> {
        const contextVarNames = ['const', 'var', 'let', 'params'];

        for (let i = startIdx; i < endIdx; i++) {
            context.idx = i;

            context.data.close.data.push(this.close[i]);
            context.data.open.data.push(this.open[i]);
            context.data.high.data.push(this.high[i]);
            context.data.low.data.push(this.low[i]);
            context.data.volume.data.push(this.volume[i]);
            context.data.hl2.data.push(this.hl2[i]);
            context.data.hlc3.data.push(this.hlc3[i]);
            context.data.ohlc4.data.push(this.ohlc4[i]);
            context.data.hlcc4.data.push(this.hlcc4[i]);
            context.data.openTime.data.push(this.openTime[i]);
            context.data.closeTime.data.push(this.closeTime[i]);
            context.data.bar_index.data.push(i);

            const result = await transpiledFn(context);

            //collect results
            if (typeof result === 'object') {
                if (typeof context.result !== 'object') {
                    context.result = {};
                }
                for (let key in result) {
                    if (context.result[key] === undefined) {
                        context.result[key] = [];
                    }

                    let val;
                    if (result[key] instanceof Series) {
                        val = result[key].get(0);
                    } else if (Array.isArray(result[key])) {
                        val = result[key][result[key].length - 1];
                    } else {
                        val = result[key];
                    }

                    context.result[key].push(val);
                }
            } else {
                if (!Array.isArray(context.result)) {
                    context.result = [];
                }

                context.result.push(result);
            }

            //shift context
            const shiftVariables = (container: any) => {
                for (let ctxVarName of contextVarNames) {
                    if (!container[ctxVarName]) continue;
                    for (let key in container[ctxVarName]) {
                        const item = container[ctxVarName][key];

                        if (item instanceof Series) {
                            const val = item.get(0);
                            item.data.push(val);
                        } else if (Array.isArray(item)) {
                            // Legacy array support during transition
                            const val = item[item.length - 1];
                            item.push(val);
                        }
                    }
                }
            };

            shiftVariables(context);
            if (context.lctx) {
                context.lctx.forEach((lctx: any) => shiftVariables(lctx));
            }
        }
    }
}

export default PineTS;
