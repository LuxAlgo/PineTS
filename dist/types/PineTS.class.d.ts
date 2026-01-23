import { IProvider } from './marketData/IProvider';
import { Context } from './Context.class';
import { Indicator } from './Indicator';
/**
 * This class is a wrapper for the Pine Script language, it allows to run Pine Script code in a JavaScript environment
 */
export declare class PineTS {
    private source;
    private tickerId?;
    private timeframe?;
    private limit?;
    private sDate?;
    private eDate?;
    data: any;
    open: any;
    high: any;
    low: any;
    close: any;
    volume: any;
    hl2: any;
    hlc3: any;
    ohlc4: any;
    hlcc4: any;
    openTime: any;
    closeTime: any;
    private _readyPromise;
    private _ready;
    private _debugSettings;
    private _transpiledCode;
    get transpiledCode(): Function | String;
    private _isSecondaryContext;
    markAsSecondary(): void;
    private _syminfo;
    constructor(source: IProvider | any[], tickerId?: string, timeframe?: string, limit?: number, sDate?: number, eDate?: number);
    setDebugSettings({ ln, debug }: {
        ln: boolean;
        debug: boolean;
    }): void;
    private loadMarketData;
    ready(): Promise<any>;
    /**
     * Run the Pine Script code and return the resulting context.
     * @param pineTSCode
     * @param periods
     * @returns Promise<Context>
     */
    run(pineTSCode: Indicator | Function | String, periods?: number): Promise<Context>;
    /**
     * Run the Pine Script code with pagination, yielding results page by page.
     * @param pineTSCode
     * @param periods
     * @param pageSize
     * @returns AsyncGenerator<Context>
     */
    run(pineTSCode: Indicator | Function | String, periods: number | undefined, pageSize: number): AsyncGenerator<Context>;
    /**
     * Stream the results of the Pine Script code.
     * Provides an event-based interface for handling streaming data.
     * @param pineTSCode The Pine Script code to execute
     * @param options Streaming options
     * @returns Object with on(event, callback) and stop() methods
     */
    stream(pineTSCode: Indicator | Function | String, options?: {
        pageSize?: number;
        live?: boolean;
        interval?: number;
    }): {
        on: (event: 'data' | 'error', callback: Function) => void;
        stop: () => void;
    };
    /**
     * Run the script completely and return the final context (backward compatible behavior)
     * @private
     */
    private _runComplete;
    /**
     * Run the script with pagination, yielding results page by page
     * Each page contains only the new results for that page, not cumulative results
     * Uses a unified loop that handles both historical and live streaming data
     * @private
     */
    private _runPaginated;
    /**
     * Get the length of the result (works for arrays and objects)
     * @private
     */
    private _getResultLength;
    /**
     * Create a context containing only the new results for the current page
     * @private
     */
    private _createPageContext;
    /**
     * Update market data from the last known candle to now (or eDate if provided)
     * Intelligently replaces the last candle if it's still open, or appends new candles
     * @param eDate - Optional end date, defaults to now
     * @returns Object containing: { newCandles: number, updatedLastCandle: boolean }
     * @private
     */
    private _updateMarketData;
    /**
     * Replace a candle at a specific index with new data
     * @private
     */
    private _replaceCandle;
    /**
     * Append a new candle to the end of market data arrays
     * @private
     */
    private _appendCandle;
    /**
     * Remove the last result from context (for updating an open candle)
     * @private
     */
    private _removeLastResult;
    /**
     * Initialize a new context for running Pine Script code
     * @private
     */
    private _initializeContext;
    /**
     * Transpile the Pine Script code
     * @private
     */
    private _transpileCode;
    /**
     * Execute iterations from startIdx to endIdx, updating the context
     * @private
     */
    private _executeIterations;
}
export default PineTS;
