// SPDX-License-Identifier: AGPL-3.0-only

import { PineTS } from '../../../PineTS.class';
import { Series } from '../../../Series';
import { splitTickerModifier, withTickerModifier } from '../../../tickerModifier';
import { TIMEFRAMES, normalizeTimeframe } from '../utils/TIMEFRAMES';
import { findSecContextIdx } from '../utils/findSecContextIdx';
import { findLTFContextIdx } from '../utils/findLTFContextIdx';
import { parseArgsForPineParams } from '../../utils';

// Pine signature (v5/v6):
//   request.security(symbol, timeframe, expression, gaps, lookahead, ignore_invalid_symbol, currency, calc_bars_count)
// Multiple sub-signatures cover progressive truncation when later positional args
// are absent — required so a single named arg (e.g. `lookahead = …`) doesn't
// invalidate matching just because trailing positional slots are unfilled.
const SECURITY_SIGNATURES = [
    ['symbol', 'timeframe', 'expression'],
    ['symbol', 'timeframe', 'expression', 'gaps'],
    ['symbol', 'timeframe', 'expression', 'gaps', 'lookahead'],
    ['symbol', 'timeframe', 'expression', 'gaps', 'lookahead', 'ignore_invalid_symbol'],
    ['symbol', 'timeframe', 'expression', 'gaps', 'lookahead', 'ignore_invalid_symbol', 'currency'],
    ['symbol', 'timeframe', 'expression', 'gaps', 'lookahead', 'ignore_invalid_symbol', 'currency', 'calc_bars_count'],
];
const SECURITY_TYPES = {
    symbol: 'series',
    timeframe: 'series',
    // `expression` accepts anything: primitive, tuple, object, Series, etc.
    expression: 'any',
    gaps: 'series',
    lookahead: 'series',
    ignore_invalid_symbol: 'series',
    currency: 'series',
    calc_bars_count: 'series',
};

/**
 * Detect a request.param wrapper tuple `[value, name]`.
 * Tuple shape: 2-element array whose [1] is a string param name.
 * (Tuple expressions like `[o, c]` are 2 elements but [1] is a Series, not a string.)
 */
function isParamTuple(v: any): v is [any, string] {
    return Array.isArray(v) && v.length === 2 && typeof v[1] === 'string';
}

/**
 * Unwrap a request.param `[value, name]` tuple into just the value, and capture
 * its name into `outNames` at the same index. Other arg shapes pass through.
 */
function unwrapParamTuples(rawArgs: any[], outNames: (string | undefined)[]): any[] {
    return rawArgs.map((a) => {
        if (isParamTuple(a)) {
            outNames.push(a[1]);
            return a[0];
        }
        outNames.push(undefined);
        return a;
    });
}

/**
 * Resolve the value of a parsed slot — handles values that are themselves
 * request.param wrapper tuples. This happens when the slot was filled via
 * the named-args bag (e.g. `lookahead: p54` where p54 is a wrapper).
 */
function resolveSlotValue(v: any): any {
    return isParamTuple(v) ? v[0] : v;
}

/**
 * Resolve the request.param name attached to a slot. Checks two sources:
 *  1. The positional argName captured at parse time (slot filled positionally).
 *  2. The wrapper tuple inside the options bag (slot filled via named args).
 */
function resolveSlotName(
    slotName: string,
    signatures: string[][],
    argNames: (string | undefined)[],
    parsedSlot: any,
): string | undefined {
    // Pick the longest signature — others are prefixes of it.
    const fullSig = signatures[signatures.length - 1];
    const idx = fullSig.indexOf(slotName);
    if (idx >= 0 && idx < argNames.length && argNames[idx] !== undefined) {
        return argNames[idx];
    }
    if (isParamTuple(parsedSlot)) return parsedSlot[1];
    return undefined;
}

/**
 * Resolve raw expression values that may contain helper objects
 * (TimeComponentHelper, TimeHelper, NAHelper, Series, etc.)
 * into their primitive values.  This is needed for same-timeframe
 * and secondary-context shortcuts where the expression isn't
 * re-evaluated through a full secondary run.
 */
function resolveExprValue(v: any): any {
    if (v == null || typeof v !== 'object') return v;
    // TimeComponentHelper, TimeHelper, NAHelper — expose __value
    if ('__value' in v) return v.__value;
    // Series — get current value
    if (v instanceof Series) return v.get(0);
    // Tuple array — resolve each element
    if (Array.isArray(v)) return v.map(resolveExprValue);
    return v;
}

export function security(context: any) {
    return async (...rawArgs: any[]) => {
        // Pine named-arg semantics: bind to the function's known signature by name,
        // not by position. The transpiler emits a trailing options object; we let
        // parseArgsForPineParams (which already handles `remaining_options`) merge
        // it into the right named slots. This is required so that calls like
        //   request.security(symbol, tf, expr, lookahead = barmerge.lookahead_on)
        // correctly set lookahead — previously the options bag was landing in the
        // `gaps` positional slot.
        const argNames: (string | undefined)[] = [];
        const args = unwrapParamTuples(rawArgs, argNames);
        const parsed = parseArgsForPineParams<any>(args, SECURITY_SIGNATURES, SECURITY_TYPES);

        // Slots filled via named-args bag may still contain wrapped [val, name] tuples
        // (e.g. `lookahead: p54` where p54 is a request.param wrapper). Unwrap each.
        const symbolSlot = resolveSlotValue(parsed.symbol);
        const timeframeSlot = resolveSlotValue(parsed.timeframe);
        const expressionSlot = resolveSlotValue(parsed.expression);
        const gapsSlot = resolveSlotValue(parsed.gaps);
        const lookaheadSlot = resolveSlotValue(parsed.lookahead);

        // Strip exchange prefix (e.g. "BINANCE:BTCUSDC" → "BTCUSDC") so the
        // provider receives a clean ticker when creating a secondary context. A
        // chart-type modifier suffix (";heikinashi") is NOT stripped here — it rides
        // through to the data source (an embedding host honors it; PineTS' own
        // providers strip it at their boundary).
        const rawSymbol = symbolSlot instanceof Series ? symbolSlot.get(0) : symbolSlot;
        // THE CHART TYPE IS THE TICKER: on a non-standard chart the context's own ticker is
        // extended ("SYM;heikinashi"), so the chart's modifier is parsed straight off it.
        const ctxNoPrefix = typeof context.tickerId === 'string' && context.tickerId.includes(':') ? context.tickerId.split(':')[1] : context.tickerId;
        const ctxParts = typeof ctxNoPrefix === 'string' ? splitTickerModifier(ctxNoPrefix) : { symbol: ctxNoPrefix, modifier: null };
        const chartModifier = ctxParts.modifier === 'standard' ? null : ctxParts.modifier;
        // Empty string "" means "use chart's symbol" (Pine Script spec) — i.e. the chart's own
        // ticker, modifier included.
        const resolvedSymbol = rawSymbol === '' ? context.tickerId : rawSymbol;
        const _symbol = typeof resolvedSymbol === 'string' && resolvedSymbol.includes(':') ? resolvedSymbol.split(':')[1] : resolvedSymbol;
        const rawTimeframe = timeframeSlot instanceof Series ? timeframeSlot.get(0) : timeframeSlot;
        // Empty string "" means "use chart's timeframe" (Pine Script spec)
        const _timeframe = rawTimeframe === '' ? context.timeframe : (typeof rawTimeframe === 'string' ? rawTimeframe : String(rawTimeframe ?? ''));
        const _expression = expressionSlot;
        // Cache key uses the request.param name attached to the expression wrapper.
        // It identifies the expression's call-site so that secContext.params lookup
        // can find the per-bar evaluated values.
        const _expression_name = resolveSlotName('expression', SECURITY_SIGNATURES, argNames, parsed.expression);
        const _gapsRaw = gapsSlot;
        const _lookaheadRaw = lookaheadSlot;
        // barmerge.gaps_off/on and barmerge.lookahead_off/on are string enums ('gaps_off', 'gaps_on', etc.)
        // Convert to boolean for correct behavior in findLTFContextIdx/findSecContextIdx
        const _gaps = _gapsRaw === true || _gapsRaw === 'gaps_on';
        const _lookahead = _lookaheadRaw === true || _lookaheadRaw === 'lookahead_on';
        // calc_bars_count gives the secondary the requested historical depth at the
        // security TF — important when chart TF is much smaller than security TF
        // (e.g. 15m chart, daily security where 500 chart bars cover only ~5 daily bars).
        const _calc_bars_count = (() => {
            const v = resolveSlotValue(parsed.calc_bars_count);
            return typeof v === 'number' && v > 0 ? v : undefined;
        })();

        // CRITICAL: Prevent infinite recursion in secondary contexts
        // If this is a secondary context (created by another request.security),
        // just return the expression value directly without creating another context
        if (context.isSecondaryContext) {
            const resolved = resolveExprValue(_expression);
            return Array.isArray(resolved) ? [resolved] : resolved;
        }

        const ctxTimeframeIdx = TIMEFRAMES.indexOf(normalizeTimeframe(context.timeframe));
        const reqTimeframeIdx = TIMEFRAMES.indexOf(normalizeTimeframe(_timeframe));

        if (ctxTimeframeIdx == -1 || reqTimeframeIdx == -1) {
            throw new Error('Invalid timeframe');
        }

        // Same-timeframe shortcut is only valid when the requested symbol is the
        // chart's symbol — at that point the secondary would just re-evaluate the
        // same data. If the symbol differs, the shortcut would return the chart's
        // expression verbatim (e.g. BTC close) for a request meant to fetch a
        // different ticker (e.g. ETH close). Fall through to the secondary-context
        // path (line ~280+) which builds a fresh PineTS instance for `_symbol`.
        // "Same" is also CHART-TYPE aware: the chart's data is its chart-typed view,
        // so on a Heikin-Ashi chart only "SYM;heikinashi" is the same series — a plain
        // "SYM" (e.g. via ticker.standard()) must fetch STANDARD data through a
        // secondary context, and vice versa on a standard chart.
        const reqParts = typeof _symbol === 'string' ? splitTickerModifier(_symbol) : { symbol: _symbol, modifier: null };
        const reqModifier = reqParts.modifier === 'standard' ? null : reqParts.modifier; // ";standard" ≡ no modifier
        const isSameSymbol = !_symbol || _symbol === '' || (reqParts.symbol === ctxParts.symbol && reqModifier === chartModifier);

        if (ctxTimeframeIdx === reqTimeframeIdx && isSameSymbol) {
            // Resolve any helper objects (TimeComponentHelper, NAHelper, Series, etc.)
            // in the expression that haven't been extracted to their primitive values yet.
            const resolved = resolveExprValue(_expression);
            return Array.isArray(resolved) ? [resolved] : resolved;
        }

        const isLTF = ctxTimeframeIdx > reqTimeframeIdx;

        const myOpenTime = Series.from(context.data.openTime).get(0);
        const myCloseTime = Series.from(context.data.closeTime).get(0);

        // On the realtime (live) bar, lookahead_off has no effect per TradingView behavior:
        // the current developing HTF values are returned instead of the previous completed bar.
        // A bar is realtime only if it's the last bar AND its close time is in the future
        // (i.e., the bar hasn't closed yet). In backtesting mode with a fixed eDate, all bars
        // are historical even the last one, so isRealtime stays false.
        const isRealtime = context.idx === context.length - 1 && myCloseTime > Date.now();

        // Cache key must be unique per symbol+timeframe+expression to avoid collisions
        const cacheKey = `${_symbol}_${_timeframe}_${_expression_name}`;
        // Cache key for tracking previous bar index (for gaps detection)
        const gapCacheKey = `${cacheKey}_prevIdx`;

        if (context.cache[cacheKey]) {
            const cached = context.cache[cacheKey];

            // Refresh secondary context when main context's data has changed (streaming mode)
            if (context.dataVersion > cached.dataVersion) {
                await cached.pineTS.updateTail(cached.context);
                cached.dataVersion = context.dataVersion;
            }

            const secContext = cached.context;
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
                : findSecContextIdx(myOpenTime, myCloseTime, secContext.data.openTime.data, secContext.data.closeTime.data, _lookahead, isRealtime);

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
        //
        // When calc_bars_count is set, leave sDate unbounded so the provider returns
        // the requested number of bars ending at secEDate — the chart's date range
        // alone may not cover enough HTF bars (e.g. 500 bars at 15m = ~5 days, but a
        // request for 500 daily bars needs ~500 days of history).
        const effectiveSDate = context.sDate
            || (context.marketData?.length > 0 ? context.marketData[0].openTime : undefined);
        const adjustedSDate = _calc_bars_count
            ? undefined
            : (effectiveSDate ? effectiveSDate - buffer : undefined);

        // Determine end date for secondary context.
        //
        // The secondary's data range must align with the chart's actual data range so
        // that `barstate.islast` in the secondary fires at the same temporal point as
        // the chart's `barstate.islast`. This matters for scripts that gate their
        // expression on barstate.islast (e.g. `barstate.islast ? data : na`) and rely
        // on lookahead to read it from the security at the chart's last bar.
        //
        // Use the chart's actual lastBarCloseTime (NOT eDate, which can be a future
        // ceiling that the chart's data hasn't reached yet, and NOT a generous buffer,
        // which would extend the secondary into future bars where barstate.islast
        // would fire AFTER the chart's last temporal point).
        //
        // Falls back to context.eDate or Date.now() if marketData isn't populated yet.
        const lastBarCloseTime = context.marketData?.length > 0
            ? context.marketData[context.marketData.length - 1].closeTime
            : 0;
        const secEDate = lastBarCloseTime || context.eDate || Date.now();

        // Pass calc_bars_count as `periods` so the secondary fetches that many bars
        // ending at secEDate — gives the script the historical depth it asked for.
        const pineTS = new PineTS(context.source, _symbol, _timeframe, _calc_bars_count, adjustedSDate, secEDate);

        // Mark as secondary context to prevent infinite recursion
        pineTS.markAsSecondary();

        // Truncated-slice slow path (Phase 4): when the transpiler emitted
        // a slice for THIS call's expression name, the secondary runs the
        // prefix-of-statements ending at the call instead of the full
        // user script. Slice keys are the bare static `pN`; for fn-nested
        // calls the runtime `_expression_name` is the path-prefixed form
        // `${$$.id}pN` (commit 812eb2d) — strip the prefix before lookup.
        // Falls back to running the FULL user script when no slice is
        // available.
        const exprNameStr = typeof _expression_name === 'string' ? _expression_name : '';
        const sliceKey = exprNameStr.match(/p\d+$/)?.[0] ?? exprNameStr;
        const slice = (context as any)._ltfTruncatedBodies?.[sliceKey];
        const secContext = slice
            ? await pineTS.runPretranspiled(slice)
            : await pineTS.run(context.pineTSCode);

        context.cache[cacheKey] = { pineTS, context: secContext, dataVersion: context.dataVersion };

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
            : findSecContextIdx(myOpenTime, myCloseTime, secContext.data.openTime.data, secContext.data.closeTime.data, _lookahead, isRealtime);

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
