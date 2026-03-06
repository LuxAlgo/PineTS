// SPDX-License-Identifier: AGPL-3.0-only

import { PineTS } from '../../../PineTS.class';
import { Series } from '../../../Series';
import { TIMEFRAMES, normalizeTimeframe } from '../utils/TIMEFRAMES';
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
        const _gapsRaw = Array.isArray(gaps) ? gaps[0] : gaps;
        const _lookaheadRaw = Array.isArray(lookahead) ? lookahead[0] : lookahead;
        // barmerge.gaps_off/on and barmerge.lookahead_off/on are string enums ('gaps_off', 'gaps_on', etc.)
        // Convert to boolean for correct behavior in findLTFContextIdx/findSecContextIdx
        const _gaps = _gapsRaw === true || _gapsRaw === 'gaps_on';
        const _lookahead = _lookaheadRaw === true || _lookaheadRaw === 'lookahead_on';

        // CRITICAL: Prevent infinite recursion in secondary contexts
        // If this is a secondary context (created by another request.security),
        // just return the expression value directly without creating another context
        if (context.isSecondaryContext) {
            return Array.isArray(_expression) ? [_expression] : _expression;
        }

        const ctxTimeframeIdx = TIMEFRAMES.indexOf(normalizeTimeframe(context.timeframe));
        const reqTimeframeIdx = TIMEFRAMES.indexOf(normalizeTimeframe(_timeframe));

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

        // Buffer to extend date range and ensure bar boundaries are covered
        const buffer = 1000 * 60 * 60 * 24 * 30; // 30 days buffer (generous)

        // Determine start date for secondary context.
        // Use context.sDate if available, otherwise derive from the earliest bar's
        // openTime to ensure the secondary context covers the same time range as the main chart.
        const effectiveSDate = context.sDate
            || (context.marketData?.length > 0 ? context.marketData[0].openTime : undefined);
        const adjustedSDate = effectiveSDate ? effectiveSDate - buffer : undefined;

        // Determine end date for secondary context.
        // The last chart bar's intrabars may extend beyond context.eDate (e.g., a weekly
        // bar that opens before eDate but whose daily intrabars close after eDate).
        // Use lastBarCloseTime to cover the full range of the last bar's intrabars.
        // When eDate is undefined (live/streaming mode), derive from the last bar's
        // closeTime or current time, adding a buffer for partial/current bars.
        const lastBarCloseTime = context.marketData?.length > 0
            ? context.marketData[context.marketData.length - 1].closeTime
            : 0;
        const secEDate = context.eDate
            ? Math.max(context.eDate, lastBarCloseTime)
            : (lastBarCloseTime || Date.now()) + buffer;

        const pineTS = new PineTS(context.source, _symbol, _timeframe, undefined, adjustedSDate, secEDate);

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
