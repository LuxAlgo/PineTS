import { IProvider } from './marketData/IProvider';
import { PineArray } from './namespaces/array/array.index';
import { Input } from './namespaces/input/input.index';
import PineMath from './namespaces/math/math.index';
import { PineRequest } from './namespaces/request/request.index';
import TechnicalAnalysis from './namespaces/ta/ta.index';
import { Series } from './Series';
export declare class Context {
    data: any;
    indicator: IndicatorOptions;
    cache: any;
    taState: any;
    isSecondaryContext: boolean;
    NA: any;
    lang: any;
    pine: {
        [key: string]: any;
    };
    private static _deprecationWarningsShown;
    idx: number;
    params: any;
    const: any;
    var: any;
    let: any;
    result: any;
    plots: any;
    marketData: any;
    source: IProvider | any[];
    tickerId: string;
    timeframe: string;
    limit: number;
    sDate: number;
    eDate: number;
    fullContext: Context;
    pineTSCode: Function | String;
    inputs: Record<string, any>;
    constructor({ marketData, source, tickerId, timeframe, limit, sDate, eDate, fullContext, inputs, }: {
        marketData: any;
        source: IProvider | any[];
        tickerId?: string;
        timeframe?: string;
        limit?: number;
        sDate?: number;
        eDate?: number;
        fullContext?: Context;
        inputs?: Record<string, any>;
    });
    private bindContextObject;
    /**
     * this function is used to initialize the target variable with the source array
     * this array will represent a time series and its values will be shifted at runtime in order to mimic Pine script behavior
     * @param trg - the target variable name : used internally to maintain the series in the execution context
     * @param src - the source data, can be Series, array, or a single value
     * @param idx - the index of the source array, used to get a sub-series of the source data
     * @returns Series object
     */
    init(trg: any, src: any, idx?: number): Series;
    /**
     * Initializes a 'var' variable.
     * - First bar: uses the initial value.
     * - Subsequent bars: maintains the previous value (state).
     * @param trg - The target variable
     * @param src - The source initializer value
     * @returns Series object
     */
    initVar(trg: any, src: any): Series;
    /**
     * this function is used to set the floating point precision of a number
     * by default it is set to 10 decimals which is the same as pine script
     * @param n - the number to be precision
     * @param decimals - the number of decimals to precision to
     * @returns the precision number
     */
    precision(value: number, decimals?: number): number;
    /**
     * This function is used to apply special transformation to internal PineTS parameters and handle them as time-series
     * @param source - the source data, can be an array or a single value
     * @param index - the index of the source array, used to get a sub-series of the source data
     * @param name - the name of the parameter, used as a unique identifier in the current execution context, this allows us to properly handle the param as a series
     * @returns the current value of the param
     */
    param(source: any, index: any, name?: string): any;
    /**
     * Access a series value with Pine Script semantics (reverse order)
     * @param source - The source series or array
     * @param index - The lookback index (0 = current value)
     */
    get(source: any, index: number): any;
    /**
     * Set the current value of a series (index 0)
     * @param target - The target series or array
     * @param value - The value to set
     */
    set(target: any, value: any): void;
    private _callStack;
    /**
     * Pushes a call ID onto the stack
     * @param id - The call ID
     */
    pushId(id: string): void;
    /**
     * Pops a call ID from the stack
     */
    popId(): void;
    /**
     * Returns the current call ID from the top of the stack
     */
    peekId(): string;
    /**
     * Calls a function with a specific call ID context
     * @param fn - The function to call
     * @param id - The call ID to use
     * @param args - Arguments to pass to the function
     */
    call(fn: Function, id: string, ...args: any[]): any;
    /**
     * @deprecated Use context.pine.math instead. This will be removed in a future version.
     */
    get math(): PineMath;
    /**
     * @deprecated Use context.pine.ta instead. This will be removed in a future version.
     */
    get ta(): TechnicalAnalysis;
    /**
     * @deprecated Use context.pine.input instead. This will be removed in a future version.
     */
    get input(): Input;
    /**
     * @deprecated Use context.pine.request instead. This will be removed in a future version.
     */
    get request(): PineRequest;
    /**
     * @deprecated Use context.pine.array instead. This will be removed in a future version.
     */
    get array(): PineArray;
    /**
     * @deprecated Use context.pine.* (e.g., context.pine.na, context.pine.plot) instead. This will be removed in a future version.
     */
    get core(): any;
    /**
     * Shows a deprecation warning once per property access pattern
     */
    private _showDeprecationWarning;
}
export default Context;
