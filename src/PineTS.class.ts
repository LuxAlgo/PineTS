// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI
import { IProvider, ISymbolInfo } from './marketData/IProvider';
import { Context } from './Context.class';
import { Series } from './Series';
import { Indicator } from './Indicator';
import { processStrategyOrders, processExitOrders, processMarginCall, finalizeStrategyBar, isAdverseFirstBar, applyPendingCloseMarginCall } from './namespaces/strategy/utils';

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

    // Tracks the most recently prepared Indicator. Used by the back-compat
    // forwarding paths (e.g. `usesVisibleRange()`) and by the internal
    // _initializeContext to surface the original pineTSCode on the Context.
    private _currentIndicator: Indicator | null = null;

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

    private _alertMode: 'realtime' | 'all' = 'realtime';

    /**
     * Set alert mode.
     * - 'realtime' (default): alerts only fire on the last (realtime) bar,
     *   matching TradingView behavior.
     * - 'all': alerts fire on every bar, useful for backtesting alert strategies.
     * @param mode Alert firing mode
     */
    public setAlertMode(mode: 'realtime' | 'all') {
        this._alertMode = mode;
    }

    // ── Visible-range / host environment ────────────────────────────────
    // Values come from the host (UI). When unset, Pine built-ins like
    // `chart.left_visible_bar_time` fall back to marketData-derived defaults
    // (first/last loaded bar's openTime).
    private _viewportLeft: number | undefined = undefined;
    private _viewportRight: number | undefined = undefined;

    // Set by `run()` from the prepared Indicator. Mirrors the Indicator's own
    // `usesVisibleRange` flag on the PineTS instance so legacy callers of
    // `pine.usesVisibleRange()` keep working.
    // True iff the script references any built-in in VIEWPORT_DEPENDENT_BUILTINS.
    // Consumers should check this before re-running on viewport changes — non-
    // viewport-dependent scripts produce identical output regardless of viewport.
    private _usesVisibleRange: boolean = false;

    // Snapshot of viewport at the time of the last update()-cached run, used to
    // decide whether an update() call can return the cached result.
    private _lastRunViewport: { left?: number; right?: number } = {};
    private _lastResult: Context | null = null;
    private _lastPineTSCode: Indicator | Function | String | null = null;

    /**
     * Set the visible range of bars from the host (e.g. chart UI viewport).
     * Affects `chart.left_visible_bar_time` and `chart.right_visible_bar_time`.
     * Defaults derive from `marketData[0]/[last].openTime` if never called.
     *
     * The setter only stores values; it does NOT trigger a re-run. Call
     * `update()` afterwards to apply the change. For scripts that don't
     * reference visible-range built-ins, `update()` is a no-op.
     *
     * @param left  openTime of the leftmost visible bar
     * @param right openTime of the rightmost visible bar
     */
    public setVisibleRange(left: number, right: number): void {
        this._viewportLeft = left;
        this._viewportRight = right;
    }

    /**
     * Whether the loaded script references any visible-range built-in
     * (e.g. `chart.left_visible_bar_time`). Detected statically during
     * transpile. Consumers fanning viewport changes across many indicators
     * should skip non-tagged instances to avoid unnecessary re-runs.
     */
    public usesVisibleRange(): boolean {
        return this._usesVisibleRange;
    }

    /** Current viewport left (undefined if setter never called). */
    public get visibleRangeLeft(): number | undefined {
        return this._viewportLeft;
    }

    /** Current viewport right (undefined if setter never called). */
    public get visibleRangeRight(): number | undefined {
        return this._viewportRight;
    }

    /**
     * Smart re-run: executes `run()` only if a re-run is actually needed.
     *
     * - First call: behaves like `run()` (always executes).
     * - Subsequent calls: returns the cached previous result UNLESS the script
     *   is viewport-dependent (`usesVisibleRange()`) AND the viewport has
     *   changed since the last cached run.
     *
     * The typical pattern for a chart consumer with multiple indicators:
     *
     *     // user pans the chart
     *     for (const p of indicators) {
     *         p.setVisibleRange(left, right);
     *         await p.update(code);   // no-op for non-viewport indicators
     *     }
     *
     * The pineTSCode argument is optional after the first call — the same code
     * is reused. Pass it again only when the script source itself has changed.
     */
    public async update(pineTSCode?: Indicator | Function | String): Promise<Context> {
        const codeToRun = pineTSCode ?? this._lastPineTSCode;
        if (!codeToRun) {
            throw new Error('pine.update(): pineTSCode is required on the first call.');
        }

        const isFirstRun = this._lastResult === null;
        const viewportChanged = this._viewportLeft !== this._lastRunViewport.left
            || this._viewportRight !== this._lastRunViewport.right;

        const needsRun = isFirstRun || (this._usesVisibleRange && viewportChanged);
        if (!needsRun) return this._lastResult as Context;

        this._lastPineTSCode = codeToRun;
        this._lastRunViewport = { left: this._viewportLeft, right: this._viewportRight };
        this._lastResult = (await this.run(codeToRun)) as Context;
        return this._lastResult;
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
        const ind = Indicator.from(pineTSCode as any);
        this._currentIndicator = ind;
        // NB: `ind.prepare()` may throw synchronously for malformed Pine /
        // unparseable JS. We push it inside the async path so the throw
        // surfaces as a Promise rejection (matches the pre-refactor contract:
        // `await pine.run(badCode)` rejects, never throws synchronously).

        if (pageSize && pageSize > 0) {
            const enableLiveStream = typeof this.eDate === 'undefined' && !Array.isArray(this.source);
            return this._runPaginated(ind, periods, pageSize, enableLiveStream);
        } else {
            return this._runComplete(ind, periods);
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
    ): { on: (event: 'data' | 'error' | 'warning' | 'alert', callback: Function) => void; stop: () => void } {
        const { live = true, interval = 1000 } = options;
        const pageSize = options.pageSize || this.data.length; // Default pageSize to full data if not provided

        const ind = Indicator.from(pineTSCode as any);
        this._currentIndicator = ind;
        // prepare() is deferred to inside _runPaginated so transpile errors
        // surface as Promise rejections on the stream's `error` event.

        const listeners: { [key: string]: Function[] } = { data: [], error: [], warning: [], alert: [] };
        let stopped = false;

        const emit = (event: string, ...args: any[]) => {
            if (listeners[event]) {
                listeners[event].forEach((cb) => cb(...args));
            }
        };

        const on = (event: 'data' | 'error' | 'warning' | 'alert', callback: Function) => {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(callback);
        };

        const stop = () => {
            stopped = true;
        };

        // Start execution
        (async () => {
            try {
                // When live streaming is requested with an eDate, clamp eDate to now
                // to avoid gaps between historical data end and live data start
                if (live && typeof this.eDate !== 'undefined') {
                    this.eDate = Math.max(this.eDate, Date.now());
                }

                // Determine if live streaming is possible and requested
                const isLiveCapable = !Array.isArray(this.source);
                const enableLiveStream = isLiveCapable && live;

                // Pass undefined for periods to include all data
                // We use the generator version directly to control enableLiveStream
                const iterator = this._runPaginated(ind, undefined, pageSize, enableLiveStream);

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

                    // Emit any NEW runtime warnings accumulated since last tick
                    if (ctx.warnings && ctx.warnings.length > 0) {
                        for (const w of ctx.warnings) {
                            emit('warning', w);
                        }
                        // Clear so next tick only emits newly added warnings
                        ctx.warnings.length = 0;
                    }

                    // Emit any NEW alert events accumulated since last tick
                    if (ctx.alerts && ctx.alerts.length > 0) {
                        for (const a of ctx.alerts) {
                            emit('alert', a);
                        }
                        // Clear so next tick only emits newly added alerts
                        ctx.alerts.length = 0;
                    }

                    // If live streaming is enabled, wait for the interval before fetching next data
                    // This prevents hammering the API when new data is available immediately or in rapid succession
                    if (enableLiveStream && !stopped) {
                        const currentCandle = ctx.marketData[ctx.idx];
                        const isHistorical = currentCandle && currentCandle.closeTime < Date.now();
                        const isLastBar = ctx.idx >= ctx.marketData.length - 1;

                        // Always throttle when on the last bar (caught up to current data).
                        // For mid-stream historical pages, skip the delay so initial load is fast.
                        if (!isHistorical || isLastBar) {
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
     * Run an already-transpiled PineTS function in this instance — no
     * additional transpile/parse pass. Used by `request.security_lower_tf`'s
     * slow path to execute the slice produced at primary-transpile time
     * (a truncated body containing only the prefix up to the call). The
     * caller is responsible for ensuring `transpiledFn` was produced by
     * this transpiler against the same source — calling this with an
     * arbitrary function is unsafe.
     */
    public async runPretranspiled(transpiledFn: Function, inputs: Record<string, any> = {}, periods?: number): Promise<Context> {
        await this.ready();
        if (!periods) periods = this.data.length;

        const context = this._initializeContext(null as any, inputs, this._isSecondaryContext);
        this._transpiledCode = transpiledFn;
        // Preserve slice attribution on the context so any nested LTF
        // request inside the slice can keep using the same map.
        const slices = (transpiledFn as any)._ltfSlices;
        if (slices) (context as any)._ltfTruncatedBodies = slices;

        await this._executeIterations(context, transpiledFn, this.data.length - periods, this.data.length);

        return context;
    }

    /**
     * Run the script completely and return the final context.
     *
     * Execution is split: all bars except the last are processed first, then a
     * var-state snapshot is taken, then the last bar is processed. This gives
     * updateTail() a reliable snapshot-based restore point, matching the
     * pattern used by _runPaginated and eliminates the pop-based drift that
     * occurred when var variables were modified in-place during re-execution.
     * @private
     */
    private async _runComplete(ind: Indicator, periods?: number): Promise<Context> {
        await this.ready();
        if (!periods) periods = this.data.length;

        const prepared = ind.prepare(this._debugSettings);
        this._usesVisibleRange = prepared.usesVisibleRange;

        const context = this._initializeContext(ind.source ?? null as any, prepared.inputs, this._isSecondaryContext);
        this._transpiledCode = prepared.fn;
        // Propagate transpile-time slices (one per request.security_lower_tf
        // call site) onto the Context so the slow path of the LTF runtime
        // can pick the right truncated body to run in the secondary
        // instead of the FULL user script.
        if (prepared.ltfSlices) (context as any)._ltfTruncatedBodies = prepared.ltfSlices;

        // Split execution: process all bars except the last, snapshot, then
        // process the last bar. This gives updateTail() a reliable restore
        // point, matching the pattern used by _runPaginated.
        const startIdx = this.data.length - periods;
        const endIdx = this.data.length;

        if (endIdx - startIdx > 1) {
            await this._executeIterations(context, prepared.fn, startIdx, endIdx - 1);
            (context as any)._varSnapshot = this._snapshotVarState(context);
            await this._executeIterations(context, prepared.fn, endIdx - 1, endIdx);
        } else {
            // Single bar: no meaningful pre-last range to snapshot; execute directly.
            // updateTail() will fall back to _removeLastResult on this context.
            await this._executeIterations(context, prepared.fn, startIdx, endIdx);
        }

        return context;
    }

    /**
     * Run the script with pagination, yielding results page by page
     * Each page contains only the new results for that page, not cumulative results
     * Uses a unified loop that handles both historical and live streaming data
     * @private
     */
    private async *_runPaginated(
        ind: Indicator,
        periods: number | undefined,
        pageSize: number,
        enableLiveStream: boolean = false,
    ): AsyncGenerator<Context> {
        await this.ready();
        if (!periods) periods = this.data.length;

        const prepared = ind.prepare(this._debugSettings);
        this._usesVisibleRange = prepared.usesVisibleRange;

        const context = this._initializeContext(ind.source ?? null as any, prepared.inputs, this._isSecondaryContext);
        this._transpiledCode = prepared.fn;
        if (prepared.ltfSlices) (context as any)._ltfTruncatedBodies = prepared.ltfSlices;

        const startIdx = this.data.length - periods;
        let processedUpToIdx = startIdx; // Track what we've fully processed
        let varSnapshot: any = null; // Snapshot of var state before last bar processing

        // Unified loop handles both historical and live data
        while (true) {
            const availableData = this.data.length;
            const unprocessedCount = availableData - processedUpToIdx;

            // #1: If we have unprocessed data, process it
            if (unprocessedCount > 0) {
                const toProcess = Math.min(unprocessedCount, pageSize);
                const previousResultLength = this._getResultLength(context.result);

                // If this batch includes the last bar AND live streaming is enabled,
                // snapshot the state BEFORE processing the last bar so we can restore
                // it cleanly on streaming re-execution.
                const batchEnd = processedUpToIdx + toProcess;
                if (enableLiveStream && batchEnd >= availableData && toProcess > 1) {
                    // Process all bars except the last one
                    await this._executeIterations(context, this._transpiledCode, processedUpToIdx, batchEnd - 1);
                    // Snapshot state before the last bar
                    varSnapshot = this._snapshotVarState(context);
                    // Now process the last bar
                    await this._executeIterations(context, this._transpiledCode, batchEnd - 1, batchEnd);
                } else if (enableLiveStream && batchEnd >= availableData && toProcess === 1) {
                    // Only 1 bar to process (the last one) — snapshot is already set from previous batch
                    await this._executeIterations(context, this._transpiledCode, processedUpToIdx, batchEnd);
                } else {
                    await this._executeIterations(context, this._transpiledCode, processedUpToIdx, batchEnd);
                }

                processedUpToIdx += toProcess;

                // Yield the page with new results
                const pageContext = this._createPageContext(context, previousResultLength);
                yield pageContext;
                continue;
            }

            // UNUSED — snapshot is now taken in #1 before processing the last bar

            // #2: Caught up to current data (processedUpToIdx === this.data.length)

            // If not live streaming, we're done
            if (!enableLiveStream || Array.isArray(this.source)) {
                break;
            }

            // #3: Fetch new data, always starting from last candle's openTime
            // Throttle: minimum 1 second between API fetches to prevent hammering
            const fetchStart = Date.now();
            const { newCandles, updatedLastCandle } = await this._updateMarketData();
            const fetchDuration = Date.now() - fetchStart;

            if (newCandles === 0 && !updatedLastCandle) {
                // No new data available, yield null to signal caller
                yield null as any;
                continue;
            }

            // If only the last candle was updated (no new bars), throttle to avoid
            // rapid-fire fetching when the market is closed or candle is still forming
            if (newCandles === 0 && updatedLastCandle && fetchDuration < 1000) {
                await new Promise((resolve) => setTimeout(resolve, 1000 - fetchDuration));
            }

            // #4: Data changed — bump version so secondary contexts know to refresh
            context.dataVersion++;

            // Update context.length so barstate.islast (which checks
            // context.idx === context.length - 1) works correctly for new bars.
            // Without this, barstate.islast stays false after new candles arrive,
            // and any `if barstate.islast` drawing logic never executes.
            context.length = this.data.length;

            // Restore variable state to the snapshot (before last bar was processed).
            // This is more reliable than _removeLastResult's pop-based approach for
            // var variables, which can drift when re-executing modifies values in-place.
            // _restoreVarState handles var/let/const/params Series truncation,
            // so we skip _removeLastResult (which would double-pop).
            this._restoreVarState(context, varSnapshot);

            // Still need to remove last result and market data series entries
            // (these are not covered by _restoreVarState)
            if (Array.isArray(context.result)) {
                context.result.pop();
            } else if (typeof context.result === 'object' && context.result !== null) {
                for (let key in context.result) {
                    if (Array.isArray(context.result[key])) {
                        context.result[key].pop();
                    }
                }
            }
            // Pop market data series (close, open, high, low, volume, etc.)
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
            if (context.data.closeTime) context.data.closeTime.data.pop();
            context.data.bar_index.data.pop();

            // Step back one position to reprocess last candle
            processedUpToIdx = this.data.length - (newCandles + 1);

            // Roll back drawing objects created during the previous processing of
            // these bars so they don't accumulate on each streaming tick.
            context.rollbackDrawings(processedUpToIdx);

            // If new candles arrived, invalidate snapshot (will re-snapshot after next full process)
            if (newCandles > 0) {
                varSnapshot = null;
            }

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

        // Copy runtime warnings
        pageContext.warnings = fullContext.warnings;

        // Copy alert events
        pageContext.alerts = fullContext.alerts;

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
     *
     * Uses snapshot-restore for reliable var state rollback, matching the
     * approach used by _runPaginated. The pop-based _removeLastResult is
     * only used as a fallback for contexts that have no snapshot (e.g. those
     * produced by runPretranspiled, which skips the split-execute pattern).
     *
     * After restoring state and re-executing, a fresh snapshot is taken before
     * the last bar so that subsequent updateTail() calls also have a valid
     * restore point.
     *
     * @param context - The cached secondary context to update
     * @returns true if data was updated, false if no changes
     */
    public async updateTail(context: Context): Promise<boolean> {
        // Guard: skip if no data (e.g. secondary context failed to load from provider)
        if (this.data.length === 0 || Array.isArray(this.source)) return false;

        const { newCandles, updatedLastCandle } = await this._updateMarketData();
        if (newCandles === 0 && !updatedLastCandle) return false;

        // Use snapshot-restore for reliable var state rollback.
        // _removeLastResult's pop-based approach drifts when re-executing
        // modifies var values in-place (see _runPaginated comment, line 591).
        const snapshot = (context as any)._varSnapshot;
        if (snapshot) {
            this._restoreVarState(context, snapshot);
        } else {
            // No snapshot available (context from runPretranspiled or single-bar
            // _runComplete) — fall back to pop-based rollback.
            this._removeLastResult(context);
        }

        // Pop result + market-data series.
        // _restoreVarState handles var/let/const/params Series but does NOT
        // cover result arrays or the market data series on context.data —
        // those must be popped explicitly here.
        if (Array.isArray(context.result)) {
            context.result.pop();
        } else if (typeof context.result === 'object' && context.result !== null) {
            for (let key in context.result) {
                if (Array.isArray(context.result[key])) {
                    context.result[key].pop();
                }
            }
        }

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
        if (context.data.closeTime) context.data.closeTime.data.pop();
        context.data.bar_index.data.pop();

        context.dataVersion = (context.dataVersion || 0) + 1;
        context.length = this.data.length;

        const processFrom = this.data.length - (newCandles + 1);
        context.rollbackDrawings(processFrom);

        // Split execution: process bars before last → snapshot → last bar.
        // Ensures the next updateTail() call has a fresh, valid restore point.
        const endIdx = this.data.length;

        if (processFrom < endIdx - 1) {
            // Multiple bars to re-execute: snapshot before the last one.
            await this._executeIterations(context, this._transpiledCode as Function, processFrom, endIdx - 1);
            (context as any)._varSnapshot = this._snapshotVarState(context);
            await this._executeIterations(context, this._transpiledCode as Function, endIdx - 1, endIdx);
        } else {
            // Only 1 bar to re-execute (same-bar tick update).
            // The existing snapshot remains valid as "before this bar" — no refresh needed.
            await this._executeIterations(context, this._transpiledCode as Function, processFrom, endIdx);
        }

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
     * Snapshot the var/let/const/params Series state for streaming rollback.
     * Captures the data array length and last value for each variable so we can
     * restore to this exact state before re-executing the last bar.
     *
     * PERF NOTE: This currently snapshots ALL scopes (const, var, let, params).
     * In practice, only `var` variables need snapshot/restore because:
     *   - `let` variables are re-initialized every bar via $.init() — they reset naturally
     *   - `const` variables are set once and never modified
     *   - `params` are function parameters, not modified across bars
     * Only `var` variables persist and get modified in-place by $.set() (e.g. n += 1),
     * which causes drift on streaming re-execution.
     * If this becomes a bottleneck, narrow to `['var']` only.
     *
     * An even lighter alternative: make $.set() on var Series append-only (push
     * instead of in-place modify). Then the existing pop-based _removeLastResult
     * would correctly revert var state without any snapshot. This would require
     * changes to the core Series/set mechanics.
     *
     * @private
     */
    private _snapshotVarState(context: Context): any {
        const contextVarNames = ['const', 'var', 'let', 'params'];
        const snapshot: any = { main: {}, lctx: [] };

        const snapContainer = (container: any) => {
            const snap: any = {};
            for (const ctxVarName of contextVarNames) {
                if (!container[ctxVarName]) continue;
                snap[ctxVarName] = {};
                for (const key in container[ctxVarName]) {
                    const item = container[ctxVarName][key];
                    if (item instanceof Series) {
                        // Save length AND the last value so we can restore both
                        const len = item.data.length;
                        const lastVal = len > 0 ? item.data[len - 1] : undefined;
                        snap[ctxVarName][key] = { len, lastVal };
                    }
                }
            }
            return snap;
        };

        snapshot.main = snapContainer(context);
        if (context.lctx) {
            const lctxSnaps: any[] = [];
            context.lctx.forEach((lctx: any) => lctxSnaps.push(snapContainer(lctx)));
            snapshot.lctx = lctxSnaps;
        }

        // Also snapshot result and data array lengths
        snapshot.resultLength = this._getResultLength(context.result);
        snapshot.dataLength = context.data.close?.data?.length ?? 0;

        return snapshot;
    }

    /**
     * Restore var/let/const/params Series state from a snapshot.
     * Truncates each Series' data array back to the snapshotted length.
     * @private
     */
    private _restoreVarState(context: Context, snapshot: any): void {
        if (!snapshot) return;
        const contextVarNames = ['const', 'var', 'let', 'params'];

        const restoreContainer = (container: any, snap: any) => {
            for (const ctxVarName of contextVarNames) {
                if (!snap[ctxVarName] || !container[ctxVarName]) continue;
                for (const key in snap[ctxVarName]) {
                    const item = container[ctxVarName][key];
                    const snapInfo = snap[ctxVarName][key];
                    if (item instanceof Series && snapInfo && typeof snapInfo.len === 'number') {
                        // Truncate back to snapshot length
                        if (item.data.length > snapInfo.len) {
                            item.data.length = snapInfo.len;
                        }
                        // Restore the last value (which may have been modified in-place)
                        if (snapInfo.len > 0 && snapInfo.lastVal !== undefined) {
                            item.data[snapInfo.len - 1] = snapInfo.lastVal;
                        }
                    }
                }
            }
        };

        restoreContainer(context, snapshot.main);
        if (context.lctx && snapshot.lctx) {
            let i = 0;
            context.lctx.forEach((lctx: any) => {
                if (snapshot.lctx[i]) restoreContainer(lctx, snapshot.lctx[i]);
                i++;
            });
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
        // Host-bound viewport overrides (chart.left/right_visible_bar_time).
        // Undefined values mean "use marketData-derived defaults" — see ChartHelper.
        context.viewportLeft = this._viewportLeft;
        context.viewportRight = this._viewportRight;

        context.__maxLoops = this._maxLoops;
        context._alertMode = this._alertMode;

        // User-explicit prop overrides flow from the Indicator to the runtime.
        // Read by Core.indicator() and initializeStrategy/strategy.any() to
        // merge on top of source-code declaration args.
        context._propOverrides = this._currentIndicator?.getRuntimePropOverrides() ?? {};

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
     * Execute iterations from startIdx to endIdx, updating the context
     * @private
     */
    private async _executeIterations(context: Context, transpiledFn: Function, startIdx: number, endIdx: number): Promise<void> {
        const contextVarNames = ['const', 'var', 'let', 'params'];

        for (let i = startIdx; i < endIdx; i++) {
            context.idx = i;
            context._execTick = (context._execTick || 0) + 1;

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

            // Process strategy orders at the START of the bar (filling at Open).
            // Entry-category orders fill first (market/limit/stop pending
            // orders), then exit-category orders evaluate against the bar's
            // open/high/low — so an exit gap-firing at the open covers trades
            // that filled at that same open (entry-first precedence). TV
            // evidence is majority-but-not-unanimous here: 3 of 4 gap events
            // in the QA pyramiding xlsx (2021-02-24, 2021-09-08, 2024-02-29)
            // catch the same-open entry; one (2024-03-21) spares it. The
            // 'open' phase of processExitOrders implements the minority
            // (exit-first) semantics and is currently not wired in.
            if (context.strategy) {
                // Book a second margin call scheduled on the PREVIOUS bar
                // by the phantom re-check (it fills at that bar's close,
                // after its script evaluation — see processMarginCall and
                // applyPendingCloseMarginCall). Must run before entries so
                // a reversal queued at that close (qty frozen at queue
                // time) overshoots by exactly the deferred quantity, as TV
                // does.
                applyPendingCloseMarginCall(context);
                processStrategyOrders(context);
                // Margin checkpoints along the intra-bar path (TV broker
                // emulator): first at the OPEN right after entries fill;
                // then at the adverse extreme — BEFORE exit fills when the
                // bar's first move is adverse for the position (the
                // extreme precedes the favorable exits on the path), AFTER
                // them otherwise (favorable exits free margin first). The
                // 'extreme' checkpoint may schedule a deferred second
                // margin call at this bar's close (phantom re-check).
                processMarginCall(context, 'open');
                const adverseFirst = isAdverseFirstBar(context);
                if (adverseFirst) processMarginCall(context, 'extreme');
                processExitOrders(context, 'intrabar');
                if (!adverseFirst) processMarginCall(context, 'extreme');
                // Latch max_drawdown / max_runup ONCE at the end of the bar so
                // trades closed mid-bar by TP / SL contribute their realized
                // P&L (not phantom intra-bar excursions against the raw H/L).
                finalizeStrategyBar(context);
            }

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

            // Sync drawing object plots after all mutations for this bar.
            // Serializes the current state of labels/lines/boxes/etc. into plain objects
            // so that context.plots contains safe, JSON-serializable data.
            for (const helper of context._drawingHelpers) {
                if (helper.syncToPlot) helper.syncToPlot();
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