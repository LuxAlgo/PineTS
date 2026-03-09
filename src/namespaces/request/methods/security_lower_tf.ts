// SPDX-License-Identifier: AGPL-3.0-only

import { PineTS } from '../../../PineTS.class';
import { Series } from '../../../Series';
import { TIMEFRAMES, normalizeTimeframe } from '../utils/TIMEFRAMES';
import { PineArrayObject, PineArrayType } from '../../array/PineArrayObject';

/**
 * Detect the PineArrayType from a runtime value.
 */
function detectArrayType(value: any): PineArrayType {
    if (typeof value === 'number') return PineArrayType.float;
    if (typeof value === 'boolean') return PineArrayType.bool;
    if (typeof value === 'string') return PineArrayType.string;
    return PineArrayType.any;
}

/**
 * Requests the results of an expression from a specified symbol on a timeframe lower than or equal to the chart's timeframe.
 * It returns an array containing one element for each lower-timeframe bar within the chart bar.
 * On a 5-minute chart, requesting data using a timeframe argument of "1" typically returns an array with five elements representing
 * the value of the expression on each 1-minute bar, ordered by time with the earliest value first.
 * @param context
 * @returns
 */
export function security_lower_tf(context: any) {
    return async (
        symbol: any,
        timeframe: any,
        expression: any,
        ignore_invalid_symbol: boolean | any[] = false,
        currency: any = null,
        ignore_invalid_timeframe: boolean | any[] = false,
        calc_bars_count: number | any[] = 0
    ) => {
        const rawSymbol = symbol[0] instanceof Series ? (symbol[0] as Series).get(0) : symbol[0];
        // Empty string "" means "use chart's symbol" (Pine Script spec)
        const resolvedSymbol = rawSymbol === '' ? context.tickerId : rawSymbol;
        const _symbol = typeof resolvedSymbol === 'string' && resolvedSymbol.includes(':') ? resolvedSymbol.split(':')[1] : resolvedSymbol;
        const rawTimeframe = timeframe[0] instanceof Series ? (timeframe[0] as Series).get(0) : timeframe[0];
        // Empty string "" means "use chart's timeframe" (Pine Script spec)
        const _timeframe = rawTimeframe === '' ? context.timeframe : (typeof rawTimeframe === 'string' ? rawTimeframe : String(rawTimeframe ?? ''));
        const _expression = expression[0];
        const _expression_name = expression[1];
        const _ignore_invalid_symbol = Array.isArray(ignore_invalid_symbol) ? ignore_invalid_symbol[0] : ignore_invalid_symbol;
        const _ignore_invalid_timeframe = Array.isArray(ignore_invalid_timeframe) ? ignore_invalid_timeframe[0] : ignore_invalid_timeframe;
        // const _calc_bars_count = Array.isArray(calc_bars_count) ? calc_bars_count[0] : calc_bars_count;

        // CRITICAL: Prevent infinite recursion in secondary contexts
        // Still wrap in PineArrayObject so array.size() etc. work in the secondary script
        if (context.isSecondaryContext) {
            if (Array.isArray(_expression)) {
                const arrays = _expression.map((v: any) =>
                    new PineArrayObject([v], detectArrayType(v), context)
                );
                return [arrays];
            } else {
                return new PineArrayObject([_expression], detectArrayType(_expression), context);
            }
        }

        const ctxTimeframeIdx = TIMEFRAMES.indexOf(normalizeTimeframe(context.timeframe));
        const reqTimeframeIdx = TIMEFRAMES.indexOf(normalizeTimeframe(_timeframe));

        if (ctxTimeframeIdx === -1 || reqTimeframeIdx === -1) {
            if (_ignore_invalid_timeframe) return NaN;
            throw new Error('Invalid timeframe');
        }

        if (reqTimeframeIdx > ctxTimeframeIdx) {
            if (_ignore_invalid_timeframe) return NaN;
            throw new Error(`Timeframe ${_timeframe} is not lower than or equal to chart timeframe ${context.timeframe}`);
        }

        if (reqTimeframeIdx === ctxTimeframeIdx) {
            if (Array.isArray(_expression)) {
                // Tuple: each element becomes a 1-element PineArrayObject
                const arrays = _expression.map((v: any) =>
                    new PineArrayObject([v], detectArrayType(v), context)
                );
                return [arrays]; // 2D for tuple destructuring
            } else {
                return new PineArrayObject([_expression], detectArrayType(_expression), context);
            }
        }

        const cacheKey = `${_symbol}_${_timeframe}_${_expression_name}_lower`;

        if (!context.cache[cacheKey]) {
            const buffer = 1000 * 60 * 60 * 24 * 30; // 30 days buffer

            // Determine start date: use context.sDate if available, otherwise
            // derive from the earliest bar's openTime (same logic as security.ts)
            const effectiveSDate = context.sDate
                || (context.marketData?.length > 0 ? context.marketData[0].openTime : undefined);
            const adjustedSDate = effectiveSDate ? effectiveSDate - buffer : undefined;

            // Determine end date: cover last bar's intrabars without overshooting
            const lastBarCloseTime = context.marketData?.length > 0
                ? context.marketData[context.marketData.length - 1].closeTime
                : 0;
            const secEDate = context.eDate
                ? Math.max(context.eDate, lastBarCloseTime)
                : (lastBarCloseTime || Date.now()) + buffer;

            const pineTS = new PineTS(context.source, _symbol, _timeframe, undefined, adjustedSDate, secEDate);
            pineTS.markAsSecondary();

            const secContext = await pineTS.run(context.pineTSCode);
            context.cache[cacheKey] = { pineTS, context: secContext, dataVersion: context.dataVersion };
        }

        const cached = context.cache[cacheKey];

        // Refresh secondary context when main context's data has changed (streaming mode)
        if (context.dataVersion > cached.dataVersion) {
            await cached.pineTS.updateTail(cached.context);
            cached.dataVersion = context.dataVersion;
        }

        const secContext = cached.context;
        
        const myOpenTime = Series.from(context.data.openTime).get(0);
        const myCloseTime = Series.from(context.data.closeTime).get(0);

        const secOpenTimes = secContext.data.openTime.data;
        const secCloseTimes = secContext.data.closeTime.data;
        const secValues = secContext.params[_expression_name];
        
        // If expression was not evaluated in secondary context (e.g. conditional execution), return empty array
        if (!secValues) {
            if (Array.isArray(_expression)) {
                const arrays = _expression.map(() =>
                    new PineArrayObject([], PineArrayType.float, context)
                );
                return [arrays];
            }
            return new PineArrayObject([], PineArrayType.float, context);
        }

        const result: any[] = [];

        for (let i = 0; i < secOpenTimes.length; i++) {
            const sOpen = secOpenTimes[i];
            const sClose = secCloseTimes[i];

            // Optimization: skip bars before our window
            if (sClose <= myOpenTime) continue;

            // Stop if we passed our window
            if (sOpen >= myCloseTime) break;

            // Overlap check: The LTF bar must overlap with the HTF bar interval [myOpenTime, myCloseTime)
            // Pine Script security_lower_tf returns all LTF bars that "belong" to the HTF bar.
            // This typically means any LTF bar whose time is >= HTF openTime and < HTF closeTime.

            // If sOpen >= myOpenTime and sOpen < myCloseTime, it belongs to this bar.
            if (sOpen >= myOpenTime && sOpen < myCloseTime) {
                result.push(secValues[i]);
            }
        }

        // Detect if expression is a tuple (each bar value is an array)
        const isTuple = result.length > 0 && Array.isArray(result[0]);

        if (isTuple) {
            // Transpose: per-bar tuples [[o1,c1],[o2,c2],...] → per-element arrays [PAO([o1,o2,...]), PAO([c1,c2,...])]
            const numElements = result[0].length;
            const transposed = [];
            for (let e = 0; e < numElements; e++) {
                const columnValues = result.map(barTuple => barTuple[e]);
                const type = columnValues.length > 0 ? detectArrayType(columnValues[0]) : PineArrayType.float;
                transposed.push(new PineArrayObject(columnValues, type, context));
            }
            return [transposed]; // 2D for tuple destructuring
        } else {
            // Scalar: single array of values wrapped in PineArrayObject
            const type = result.length > 0 ? detectArrayType(result[0]) : PineArrayType.float;
            return new PineArrayObject(result, type, context);
        }
    };
}
