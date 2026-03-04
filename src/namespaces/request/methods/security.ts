// SPDX-License-Identifier: AGPL-3.0-only

import { PineTS } from '../../../PineTS.class';
import { Series } from '../../../Series';
import { TIMEFRAMES } from '../utils/TIMEFRAMES';
import { findSecContextIdx } from '../utils/findSecContextIdx';
import { findLTFContextIdx } from '../utils/findLTFContextIdx';

export function security(context: any) {
    return async (
        symbol: any,
        timeframe: any,
        expression: any,
        gaps: boolean | any[] = false,
        lookahead: boolean | any[] = false,
        ignore_invalid_symbol: boolean = false,
        currency: any = null,
        calc_bars_count: any = null
    ) => {
        // Strip exchange prefix (e.g. "BINANCE:BTCUSDC" → "BTCUSDC") so the
        // provider receives a clean ticker when creating a secondary context.
        const rawSymbol = symbol[0];
        const _symbol = typeof rawSymbol === 'string' && rawSymbol.includes(':') ? rawSymbol.split(':')[1] : rawSymbol;
        const _timeframe = timeframe[0];
        const _expression = expression[0];
        const _expression_name = expression[1];
        const _gaps = Array.isArray(gaps) ? gaps[0] : gaps;
        const _lookahead = Array.isArray(lookahead) ? lookahead[0] : lookahead;

        // CRITICAL: Prevent infinite recursion in secondary contexts
        // If this is a secondary context (created by another request.security),
        // just return the expression value directly without creating another context
        if (context.isSecondaryContext) {
            return Array.isArray(_expression) ? [_expression] : _expression;
        }

        const ctxTimeframeIdx = TIMEFRAMES.indexOf(context.timeframe);
        const reqTimeframeIdx = TIMEFRAMES.indexOf(_timeframe);

        if (ctxTimeframeIdx == -1 || reqTimeframeIdx == -1) {
            throw new Error('Invalid timeframe');
        }

        if (ctxTimeframeIdx === reqTimeframeIdx) {
            // Wrap tuples in 2D array to match $.precision() convention
            // (same wrapping as HTF/LTF return paths below)
            return Array.isArray(_expression) ? [_expression] : _expression;
        }

        const isLTF = ctxTimeframeIdx > reqTimeframeIdx;

        const myOpenTime = Series.from(context.data.openTime).get(0);
        const myCloseTime = Series.from(context.data.closeTime).get(0);

        // Cache key must be unique per symbol+timeframe+expression to avoid collisions
        const cacheKey = `${_symbol}_${_timeframe}_${_expression_name}`;
        // Cache key for tracking previous bar index (for gaps detection)
        const gapCacheKey = `${cacheKey}_prevIdx`;

        if (context.cache[cacheKey]) {
            const secContext = context.cache[cacheKey];
            const secContextIdx = isLTF
                ? findLTFContextIdx(
                      myOpenTime,
                      myCloseTime,
                      secContext.data.openTime.data,
                      secContext.data.closeTime.data,
                      _lookahead,
                      context.eDate,
                      _gaps
                  )
                : findSecContextIdx(myOpenTime, myCloseTime, secContext.data.openTime.data, secContext.data.closeTime.data, _lookahead);

            if (secContextIdx == -1) {
                return NaN;
            }

            const value = secContext.params[_expression_name][secContextIdx];

            // Handle gaps for HTF (Higher Timeframe)
            if (!isLTF && _gaps) {
                const prevIdx = context.cache[gapCacheKey];

                // gaps=true: Only show value when the HTF bar index changes
                // - lookahead=false: Show on transition (first bar with new index)
                // - lookahead=true: Show on transition (first bar with new index)
                // Both behave the same: show only when index changes, otherwise NaN

                if (prevIdx !== undefined && prevIdx === secContextIdx) {
                    // Same index as previous call = no change = NaN
                    return NaN;
                }

                // Index changed (or first call) - update and return value
                context.cache[gapCacheKey] = secContextIdx;
                // Wrap tuples in 2D array to match $.precision() convention
                return Array.isArray(value) ? [value] : value;
            }

            // Wrap tuples in 2D array to match $.precision() convention
            return Array.isArray(value) ? [value] : value;
        }

        // Add buffer to sDate to ensure bar start is covered
        const buffer = 1000 * 60 * 60 * 24 * 30; // 30 days buffer (generous)
        const adjustedSDate = context.sDate ? context.sDate - buffer : undefined;

        // If we have a date range, we shouldn't artificially limit the bars to 1000
        const limit = context.sDate && context.eDate ? undefined : context.limit || 1000;

        // We pass undefined for eDate to allow loading full history for the security context
        const pineTS = new PineTS(context.source, _symbol, _timeframe, limit, adjustedSDate, undefined);

        // Mark as secondary context to prevent infinite recursion
        pineTS.markAsSecondary();

        const secContext = await pineTS.run(context.pineTSCode);

        context.cache[cacheKey] = secContext;

        const secContextIdx = isLTF
            ? findLTFContextIdx(
                  myOpenTime,
                  myCloseTime,
                  secContext.data.openTime.data,
                  secContext.data.closeTime.data,
                  _lookahead,
                  context.eDate,
                  _gaps
              )
            : findSecContextIdx(myOpenTime, myCloseTime, secContext.data.openTime.data, secContext.data.closeTime.data, _lookahead);

        if (secContextIdx == -1) {
            return NaN;
        }

        const value = secContext.params[_expression_name][secContextIdx];

        // Handle gaps for HTF (Higher Timeframe) - First call
        if (!isLTF && _gaps) {
            // First call: Store index and return NaN (no previous state to compare)
            context.cache[gapCacheKey] = secContextIdx;
            return NaN;
        }

        // Wrap tuples in 2D array to match $.precision() convention
        return Array.isArray(value) ? [value] : value;
    };
}
