---
layout: default
title: Request (request)
parent: Namespaces
nav_order: 4
permalink: /architecture/namespaces/request/
---

# PineTS Request (`request`) Namespace

This directory contains the implementation of Pine Script's `request.*` functions, primarily `request.security` for multi-timeframe analysis.

## Architecture

Functions are factory functions accessing the `context`.

## The `param()` Method

The `request.param()` method is highly specialized. It performs two critical tasks:

1.  **Tuple Detection**: It distinguishes between a **tuple of expressions** (e.g., `[open, close]`) and a **time-series array**.
    *   If inputs are `Series` objects, it extracts their current values.
    *   If inputs are scalars, it preserves them.
    *   Heuristic: `hasOnlySeries` or `hasOnlyScalars` check.

2.  **ID Return**: Unlike other param methods, it returns a tuple **`[value, name]`**.
    *   `value`: The extracted value(s).
    *   `name`: The unique ID (`p0`, `p1`...) assigned by the transpiler.

```typescript
return [val, name];
```

### Why Return the Name?
The `request.security` function relies on caching secondary contexts (HTF contexts). To do this efficiently, it constructs a cache key using the parameter ID (`name`). Without this ID, it wouldn't know which expression corresponds to which cached context.

## Implementation Specifics

### 1. Secondary Contexts
`request.security` creates a **new PineTS instance** (a secondary context) to evaluate the expression in the requested timeframe.
*   It prevents recursion: Secondary contexts have a flag `isSecondaryContext = true`.
*   If `request.security` is called within a secondary context, it returns the expression directly (no new context).

### 2. Tuple Handling
When `request.security` returns a tuple (e.g., from `[open, close]`), it wraps the result in a **2D array** `[[val1, val2]]`. This signals to `Context.init()` that the result is a tuple to be destructured, not a history array.

### 3. `request.footprint` — Order-Flow Data From the Provider

`request.footprint(ticks_per_row, va_percent = 70, imbalance_percent = 300)` does not spawn a secondary context: it asks the context's own **data source** for order-flow data through the optional `getFootprintData(tickerId, timeframe, limit?, sDate?, eDate?)` surface (`IFootprintProvider`, `src/marketData/IProvider.ts`). The provider returns one `FootprintBar` per bar — `{ openTime, tick?, levels: [{ price, buyVolume, sellVolume }] }` — at whatever price granularity it has. The method is in `ASYNC_METHODS`, so the transpiler `await`s it like `request.security`.

*   **Store** (`context.cache.__footprint`): bars keyed by `openTime`, built `footprint` objects keyed by bar, the argument set of the script's request (a second, different one throws TradingView's ``The script executes too many `request.footprint()` function calls.``), and the `dataVersion` the store reflects. The first call loads the whole history (`sDate` = first bar, `eDate` = last bar's `closeTime`); when `context.dataVersion` moves (streaming: forming bar ticked, new bars appended) the store re-requests from the current bar's `openTime` and replaces those bars — the forming bar's footprint grows between polls.
*   **Semantics live in `src/namespaces/footprint/`**, not in the provider, so every source shares one behavior: `FootprintObject.build()` bins levels into rows of `ticks_per_row × syminfo.mintick` anchored at price 0 (contiguous over the candle's `low..high` and every level, empty rows included; the top row is the one whose upper edge reaches `high`), then derives the POC (largest total, ties → the row closest to the footprint's middle, lower when equidistant), the value area (grow from the POC by the larger adjacent row — ties to the row closer to the POC, then upward — refusing the row that would carry the area more than 0.01 volume units past `va_percent`) and the diagonal imbalance flags (buy vs. the sell one row below, sell vs. the buy one row above, threshold `max(imbalance_percent / 100, 1)`). More than 2000 rows → `na`. Rows are `VolumeRowObject`s.
*   **`na` paths**: no provider surface or no `mintick` → a single `context.warn(…, 'request.footprint')` and `na` on every bar; a bar the provider omitted, or `ticks_per_row` of 0 / `na` → `na`; a negative argument → `PineRuntimeError`. Every `footprint.*` / `volume_row.*` accessor throws a `PineRuntimeError` for an `na` id (TradingView's ``The `footprint` ID used in the `delta()` call cannot be `na`.``). Inside `request.security()` the call runs in the secondary context, on that context's symbol, timeframe and `mintick`.
*   **Transpiler wiring**: `footprint` and `volume_row` are listed in `CONTEXT_PINE_VARS` (injection), `NAMESPACES_LIKE` (so `footprint(x)` / `volume_row(x)` reach `footprint.any` / `volume_row.any`, which reject the call with TradingView's "Could not find function or function reference" — Pine has no cast function for these types) and `NAMESPACE_COLLISION_NAMES` (a user variable named `footprint` is renamed). Typed declarations (`footprint fp = …`, `array<volume_row>`) need no special casing — the Pine parser treats them like any object type. For UNTYPED declarations, `AnalysisPass`'s `BUILTIN_PRODUCER_TYPES` infers `fp = request.footprint(…)` as `footprint` and `row = footprint.poc/vah/val/get_row_by_price(…)` as `volume_row`, so user `method`s declared on those types dispatch statically (`fp.myMethod()` → `$.call($M_myMethod, …, fp)`) exactly as they do for `l = line.new(…)`. A BUILT-IN method on a receiver statically typed `footprint` / `volume_row` (including `fp.poc()` / `fp.get_row_by_price(p)` results, typed `volume_row`) is emitted as the namespace call `$.pine.footprint.delta(fp)` rather than the optional-chained `obj?.delta?.()` used for drawings, so an `na` receiver reaches the helper's runtime error (`ORDERFLOW_METHODS` in `settings.ts`).

## Generating the Barrel File

To regenerate the `request.index.ts` file:

```bash
npm run generate:request-index
```

