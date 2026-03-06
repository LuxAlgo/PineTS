// SPDX-License-Identifier: AGPL-3.0-only

import { PineTS } from '../../../PineTS.class';
import { Series } from '../../../Series';
import { TIMEFRAMES, normalizeTimeframe } from '../utils/TIMEFRAMES';

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
        const _symbol = symbol[0];
        const _timeframe = timeframe[0];
        const _expression = expression[0];
        const _expression_name = expression[1];
        const _ignore_invalid_symbol = Array.isArray(ignore_invalid_symbol) ? ignore_invalid_symbol[0] : ignore_invalid_symbol;
        const _ignore_invalid_timeframe = Array.isArray(ignore_invalid_timeframe) ? ignore_invalid_timeframe[0] : ignore_invalid_timeframe;
        // const _calc_bars_count = Array.isArray(calc_bars_count) ? calc_bars_count[0] : calc_bars_count;

        // CRITICAL: Prevent infinite recursion in secondary contexts
        if (context.isSecondaryContext) {
            return Array.isArray(_expression) ? [_expression] : _expression;
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
            return [[_expression]];
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
            context.cache[cacheKey] = secContext;
        }

        const secContext = context.cache[cacheKey];
        
        const myOpenTime = Series.from(context.data.openTime).get(0);
        const myCloseTime = Series.from(context.data.closeTime).get(0);

        const secOpenTimes = secContext.data.openTime.data;
        const secCloseTimes = secContext.data.closeTime.data;
        const secValues = secContext.params[_expression_name];
        
        // If expression was not evaluated in secondary context (e.g. conditional execution), return empty array
        if (!secValues) return [];

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
        
        return [result];
    };
}
