// SPDX-License-Identifier: AGPL-3.0-only

import { PineTS } from '../../../PineTS.class';
import { Series } from '../../../Series';
import { TIMEFRAMES, normalizeTimeframe } from '../utils/TIMEFRAMES';
import { PineArrayObject, PineArrayType } from '../../array/PineArrayObject';
import { PineTypeObject } from '../../PineTypeObject';
import { parseArgsForPineParams } from '../../utils';

// Pine signature (v5/v6):
//   request.security_lower_tf(symbol, timeframe, expression, ignore_invalid_symbol, currency, ignore_invalid_timeframe, calc_bars_count)
// Note: no `gaps`/`lookahead` for security_lower_tf — different surface than security.
const SECURITY_LOWER_TF_SIGNATURES = [
    ['symbol', 'timeframe', 'expression'],
    ['symbol', 'timeframe', 'expression', 'ignore_invalid_symbol'],
    ['symbol', 'timeframe', 'expression', 'ignore_invalid_symbol', 'currency'],
    ['symbol', 'timeframe', 'expression', 'ignore_invalid_symbol', 'currency', 'ignore_invalid_timeframe'],
    ['symbol', 'timeframe', 'expression', 'ignore_invalid_symbol', 'currency', 'ignore_invalid_timeframe', 'calc_bars_count'],
];
const SECURITY_LOWER_TF_TYPES = {
    symbol: 'series',
    timeframe: 'series',
    expression: 'any',
    ignore_invalid_symbol: 'series',
    currency: 'series',
    ignore_invalid_timeframe: 'series',
    calc_bars_count: 'series',
};

function isParamTuple(v: any): v is [any, string] {
    return Array.isArray(v) && v.length === 2 && typeof v[1] === 'string';
}

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

function resolveSlotValue(v: any): any {
    return isParamTuple(v) ? v[0] : v;
}

function resolveSlotName(
    slotName: string,
    signatures: string[][],
    argNames: (string | undefined)[],
    parsedSlot: any,
): string | undefined {
    const fullSig = signatures[signatures.length - 1];
    const idx = fullSig.indexOf(slotName);
    if (idx >= 0 && idx < argNames.length && argNames[idx] !== undefined) {
        return argNames[idx];
    }
    if (isParamTuple(parsedSlot)) return parsedSlot[1];
    return undefined;
}

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
 * Names of price/time builtins on `context.data` that the LTF fast path
 * can resolve directly from the secondary's market-data candles, without
 * having to run a single line of the user script in the secondary
 * context. Maps the Pine builtin name to the candle field it reads.
 */
const BUILTIN_TO_CANDLE_FIELD: Record<string, (c: any) => any> = {
    open:    (c) => c.open,
    high:    (c) => c.high,
    low:     (c) => c.low,
    close:   (c) => c.close,
    volume:  (c) => c.volume,
    hl2:     (c) => (c.high + c.low) / 2,
    hlc3:    (c) => (c.high + c.low + c.close) / 3,
    ohlc4:   (c) => (c.high + c.low + c.open + c.close) / 4,
    hlcc4:   (c) => (c.high + c.low + c.close + c.close) / 4,
    time:    (c) => c.openTime,
    openTime:  (c) => c.openTime,
    closeTime: (c) => c.closeTime,
};

/**
 * If `series` is one of `context.data.<builtin>` (by reference identity),
 * return the builtin name. Otherwise null. Reference equality is the
 * right test because every Pine Script's `close`/`high`/etc. resolves
 * to the same Series instance held on `context.data` for the lifetime
 * of the script (see PineTS.class.ts `_initializeContext`).
 */
function builtinNameOf(series: any, context: any): string | null {
    if (!(series instanceof Series)) return null;
    const data = context?.data;
    if (!data) return null;
    for (const name of Object.keys(BUILTIN_TO_CANDLE_FIELD)) {
        if (series === data[name]) return name;
    }
    return null;
}

/**
 * Descriptor returned by the pure-builtin detector. Drives the shape of
 * the values written into the synthesised secondary context's
 * `params[expression_name]`.
 *   - `kind: 'series'` — single bare builtin (e.g. `close`); each LTF
 *     bar produces one scalar.
 *   - `kind: 'tuple'`  — array of bare builtins (e.g. `[open, …, volume]`);
 *     each LTF bar produces a 5-tuple of scalars.
 *   - `kind: 'udt'`    — UDT instance whose ALL field defaults are bare
 *     builtins (e.g. `type candle { float o = open; float h = high; …}`);
 *     each LTF bar produces a fresh PineTypeObject of that type, fields
 *     populated from the candle.
 */
type BuiltinExpr =
    | { kind: 'series'; builtinNames: [string] }
    | { kind: 'tuple'; builtinNames: string[] }
    | { kind: 'udt'; builtinNames: string[]; fieldNames: string[]; udt: any };

/**
 * UDT detector — succeeds when ALL of the type's fields have bare-
 * builtin defaults (Series identity preserved on the factory's
 * `_fieldDefaults` map by Core.ts `Type()`). A field with no default
 * or a non-builtin default disqualifies the whole UDT.
 */
function detectPureBuiltinUdt(source: any, context: any): BuiltinExpr | null {
    // `let mycandle = candle.new()` stores the UDT instance inside a
    // Series slot (`$.let.glb1_mycandle`); when passed as the third
    // argument to `request.security_lower_tf`, request.param sees the
    // Series itself, not the inner PineTypeObject. Unwrap to peek at
    // the current bar's instance.
    if (source instanceof Series) {
        source = source.get(0);
    }
    if (!(source instanceof PineTypeObject)) return null;
    const udt = source._udt;
    if (!udt || !udt._fieldDefaults || !Array.isArray(udt._definitionKeys)) return null;
    const fieldNames: string[] = udt._definitionKeys;
    if (fieldNames.length === 0) return null;
    const builtinNames: string[] = [];
    for (const f of fieldNames) {
        if (!(f in udt._fieldDefaults)) return null;
        const def = udt._fieldDefaults[f];
        const name = builtinNameOf(def, context);
        if (name === null) return null;
        builtinNames.push(name);
    }
    return { kind: 'udt', builtinNames, fieldNames, udt };
}

/**
 * Inspect the original (pre-extraction) `expression` source recorded by
 * `request.param` and return a descriptor of its fast-path shape, or
 * null if the expression isn't a pure-builtin form. Three cases handled:
 *   - bare Series (e.g. `close`) → kind 'series'
 *   - tuple of bare Series (e.g. `[open, …]`) → kind 'tuple'
 *   - UDT whose every field default is a bare Series → kind 'udt'
 */
function detectPureBuiltinExpression(originalSource: any, context: any): BuiltinExpr | null {
    if (originalSource === undefined) return null;
    if (Array.isArray(originalSource)) {
        const names: string[] = [];
        for (const elem of originalSource) {
            const n = builtinNameOf(elem, context);
            if (n === null) return null;
            names.push(n);
        }
        return names.length > 0 ? { kind: 'tuple', builtinNames: names } : null;
    }
    const single = builtinNameOf(originalSource, context);
    if (single !== null) return { kind: 'series', builtinNames: [single] };
    return detectPureBuiltinUdt(originalSource, context);
}

/**
 * Fast path: build a minimal "secondary context" object whose shape
 * matches the subset of fields the downstream LTF aggregation reads —
 * `data.openTime.data`, `data.closeTime.data`, and
 * `params[expression_name]`. No PineTS instance is created and no user
 * script ever runs in the secondary; we just open the LTF candle stream
 * and shred each candle into its requested builtin field(s).
 *
 * The shape of `values[i]` (each LTF bar's contribution to the
 * captured expression) follows the descriptor:
 *   - 'series' → scalar
 *   - 'tuple'  → array of scalars
 *   - 'udt'    → fresh `PineTypeObject` whose fields are populated from
 *                that LTF candle (matching what the slow path would
 *                have produced when running `MyType.new()` per LTF bar
 *                with builtin defaults resolved against the secondary's
 *                `context.data`).
 */
async function buildFastBuiltinSecContext(
    context: any,
    _symbol: string,
    _timeframe: string,
    _calc_bars_count: number | undefined,
    expr: BuiltinExpr,
    expressionName: string,
) {
    const effectiveSDate = context.sDate
        || (context.marketData?.length > 0 ? context.marketData[0].openTime : undefined);
    const lastBarCloseTime = context.marketData?.length > 0
        ? context.marketData[context.marketData.length - 1].closeTime
        : 0;
    const secEDate = lastBarCloseTime || context.eDate || Date.now();

    // Reuse PineTS's data-loading path so we get exactly the same
    // candle stream a slow-path secondary would have used (provider,
    // pagination semantics, syminfo). Wait for `ready()` and read the
    // populated arrays — never call `run()`, so no transpile, no
    // iteration, no shifts, no helpers.
    const pineTS = new PineTS(context.source, _symbol, _timeframe, _calc_bars_count, effectiveSDate, secEDate);
    pineTS.markAsSecondary();
    await pineTS.ready();

    // Use the openTime/closeTime arrays already prepared by the
    // PineTS instance — these have the closeTime fallback (openTime +
    // timeframe duration) applied for providers that omit closeTime.
    // Reading raw `marketData[i].closeTime` would diverge from the
    // slow-path secondary, breaking the bar-grouping check downstream.
    const openTimes = (pineTS as any).openTime as number[];
    const closeTimes = (pineTS as any).closeTime as number[];
    const candles = (pineTS as any).data as any[];

    const fieldGetters = expr.builtinNames.map((n) => BUILTIN_TO_CANDLE_FIELD[n]);

    let values: any[];
    if (expr.kind === 'series') {
        values = candles.map((c) => fieldGetters[0](c));
    } else if (expr.kind === 'tuple') {
        values = candles.map((c) => fieldGetters.map((g) => g(c)));
    } else {
        // UDT: synthesise a PineTypeObject per LTF bar. We bypass
        // `udt.new(...)` and construct directly so the fields are
        // populated from the LTF candle (not from the primary
        // context's `context.data.<builtin>`, which is what the
        // factory's defaults would resolve to).
        const fieldNames = (expr as any).fieldNames as string[];
        const udt = (expr as any).udt;
        values = candles.map((c) => {
            const fields: Record<string, any> = {};
            for (let i = 0; i < fieldNames.length; i++) {
                fields[fieldNames[i]] = fieldGetters[i](c);
            }
            return new PineTypeObject(fields, context, udt);
        });
    }

    return {
        data: {
            openTime: { data: openTimes },
            closeTime: { data: closeTimes },
        },
        params: { [expressionName]: values },
    };
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
    return async (...rawArgs: any[]) => {
        // Same Pine named-args resolution as request.security — bind by name to the
        // documented signature, with the trailing options bag merged into named slots.
        const argNames: (string | undefined)[] = [];
        const args = unwrapParamTuples(rawArgs, argNames);
        const parsed = parseArgsForPineParams<any>(args, SECURITY_LOWER_TF_SIGNATURES, SECURITY_LOWER_TF_TYPES);

        const symbolSlot = resolveSlotValue(parsed.symbol);
        const timeframeSlot = resolveSlotValue(parsed.timeframe);
        const expressionSlot = resolveSlotValue(parsed.expression);

        const rawSymbol = symbolSlot instanceof Series ? symbolSlot.get(0) : symbolSlot;
        // Empty string "" means "use chart's symbol" (Pine Script spec) — i.e. the chart's own
        // ticker. THE CHART TYPE IS THE TICKER: on a non-standard chart it already carries the
        // ";heikinashi" modifier, which rides through to the data source (PineTS' own providers
        // strip it at their boundary).
        const resolvedSymbol = rawSymbol === '' ? context.tickerId : rawSymbol;
        const _symbol = typeof resolvedSymbol === 'string' && resolvedSymbol.includes(':') ? resolvedSymbol.split(':')[1] : resolvedSymbol;
        const rawTimeframe = timeframeSlot instanceof Series ? timeframeSlot.get(0) : timeframeSlot;
        // Empty string "" means "use chart's timeframe" (Pine Script spec)
        const _timeframe = rawTimeframe === '' ? context.timeframe : (typeof rawTimeframe === 'string' ? rawTimeframe : String(rawTimeframe ?? ''));
        const _expression = expressionSlot;
        const _expression_name = resolveSlotName('expression', SECURITY_LOWER_TF_SIGNATURES, argNames, parsed.expression);
        const _ignore_invalid_symbol = resolveSlotValue(parsed.ignore_invalid_symbol);
        const _ignore_invalid_timeframe = resolveSlotValue(parsed.ignore_invalid_timeframe);
        const _calc_bars_count = (() => {
            const v = resolveSlotValue(parsed.calc_bars_count);
            return typeof v === 'number' && v > 0 ? v : undefined;
        })();

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

        // Fast path: when the captured expression is a bare price/time
        // builtin Series (or a tuple of them — e.g. `[open, high, low,
        // close, volume]`), the secondary doesn't need to run a single
        // line of the user script. Every LTF bar's value of `close` IS
        // the LTF candle's `close`. We fetch the candles once and build
        // the secondary context's `params[expression_name]` directly.
        // This is what dominates request.security_lower_tf perf for the
        // ~90% of indicators that pull raw OHLCV at 1m (footprint,
        // volume profile, structural-leg-profiler, …).
        const originalSource = context._requestParamSources?.[_expression_name];
        const builtinExpr = detectPureBuiltinExpression(originalSource, context);

        if (!context.cache[cacheKey]) {
            if (builtinExpr !== null) {
                // ── Fast path ────────────────────────────────────────
                const fastSecContext = await buildFastBuiltinSecContext(
                    context, _symbol, _timeframe, _calc_bars_count,
                    builtinExpr, _expression_name,
                );
                context.cache[cacheKey] = {
                    pineTS: null,
                    context: fastSecContext,
                    dataVersion: context.dataVersion,
                    _fastPath: true,
                    _fastPathArgs: { builtinExpr },
                };
            } else {
                // ── Slow path: run the user script in a secondary ──
                // For request.security_lower_tf the secondary's data window
                // is bounded by the chart's own window — every LTF bar that
                // contributes to a chart bar falls inside that chart bar's
                // [openTime, closeTime]. Adding a fixed historical buffer
                // (the way security.ts does for higher-timeframe warmup)
                // blows up bar counts dramatically: a 30-day buffer at 1-
                // minute LTF forces the secondary to iterate ~43,200 extra
                // bars before the main loop can advance past bar 0, which
                // manifests as a multi-minute hang on small charts (e.g.
                // 50 bars on 5m). Use the chart's earliest openTime.
                const effectiveSDate = context.sDate
                    || (context.marketData?.length > 0 ? context.marketData[0].openTime : undefined);
                const adjustedSDate = effectiveSDate;

                const lastBarCloseTime = context.marketData?.length > 0
                    ? context.marketData[context.marketData.length - 1].closeTime
                    : 0;
                const secEDate = lastBarCloseTime || context.eDate || Date.now();

                const pineTS = new PineTS(context.source, _symbol, _timeframe, _calc_bars_count, adjustedSDate, secEDate);
                pineTS.markAsSecondary();

                // Truncated-slice slow path: when the transpiler emitted a
                // slice for THIS call's expression name, the secondary
                // runs the prefix-of-statements ending at the call —
                // skipping all post-call work the slow path used to drag
                // along. Falls back to running the FULL user script when
                // no slice is available.
                //
                // For fn-nested calls (Phase 3), `request.param` runs
                // inside a function scope and the codegen prefixes the
                // param name with `$$.id + 'pN'` — so the runtime
                // `_expression_name` is something like `<path>p3` whereas
                // the slice map is keyed by the bare static `pN`. Extract
                // the trailing `pN` for the lookup.
                const exprNameStr = typeof _expression_name === 'string' ? _expression_name : '';
                const sliceKey = exprNameStr.match(/p\d+$/)?.[0] ?? exprNameStr;
                const slice = (context as any)._ltfTruncatedBodies?.[sliceKey];
                let secContext: any;
                if (slice) {
                    secContext = await pineTS.runPretranspiled(slice);
                } else {
                    secContext = await pineTS.run(context.pineTSCode);
                }
                context.cache[cacheKey] = { pineTS, context: secContext, dataVersion: context.dataVersion };
            }
        }

        const cached = context.cache[cacheKey];

        // Refresh secondary context when main context's data has changed (streaming mode)
        if (context.dataVersion > cached.dataVersion) {
            if (cached._fastPath) {
                // Re-fetch and rebuild the fast-path cache entry — there
                // is no `updateTail` for fast-path entries because no
                // PineTS instance was constructed.
                const refreshed = await buildFastBuiltinSecContext(
                    context, _symbol, _timeframe, _calc_bars_count,
                    cached._fastPathArgs.builtinExpr, _expression_name,
                );
                cached.context = refreshed;
                cached.dataVersion = context.dataVersion;
            } else {
                await cached.pineTS.updateTail(cached.context);
                cached.dataVersion = context.dataVersion;
            }
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
