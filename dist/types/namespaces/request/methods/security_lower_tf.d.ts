/**
 * Requests the results of an expression from a specified symbol on a timeframe lower than or equal to the chart's timeframe.
 * It returns an array containing one element for each lower-timeframe bar within the chart bar.
 * On a 5-minute chart, requesting data using a timeframe argument of "1" typically returns an array with five elements representing
 * the value of the expression on each 1-minute bar, ordered by time with the earliest value first.
 * @param context
 * @returns
 */
export declare function security_lower_tf(context: any): (symbol: any, timeframe: any, expression: any, ignore_invalid_symbol?: boolean | any[], currency?: any, ignore_invalid_timeframe?: boolean | any[], calc_bars_count?: number | any[]) => Promise<any>;
