# Change Log

## [0.9.10] - 2026-04-07 - Drawing Caps, Linefill Dedupe & Live-Stream Throttle

### Added

- **`max_*_count` for drawing objects**: **Box**, **label**, **line**, and **polyline** helpers enforce **`max_boxes_count`**, **`max_labels_count`**, **`max_lines_count`**, and **`max_polylines_count`** from **`context.indicator`** (defaults **50**). When the active count exceeds the limit, the **oldest non-deleted** objects are marked deleted (**FIFO**), matching TradingView-style caps and avoiding unbounded growth.
- **`linefill.new()` pair deduplication**: If a **linefill** already exists between the **same two lines** (either order), the existing object is **updated in place** (color, bar) instead of appending another — same behavior as TradingView when `linefill.new()` runs every bar without deleting the previous fill.
- **`force_overlay` for linefills**: **`LinefillObject.toPlotData()`** sets **`force_overlay`** when **either** referenced line uses it; **`syncToPlot()`** emits **`__linefills_overlay__`** as a separate overlay plot (aligned with box/line/label splitting).
- **Plot colors from chart theme getters**: **`plot()`** resolves **`options.color`** when it is a **bound function** (e.g. **`chart.fg_color`**, **`chart.bg_color`**) by calling it, so theme-driven colors work like on TradingView.

### Fixed

- **Live stream / pagination loop**: When **`runLive`** is on the **last bar** (caught up to the feed), the per-iteration delay now **always runs**, even if **`closeTime`** is still in the past — avoids tight loops that ignore **`interval`**. When a fetch **only updates the last candle** (no new bars), adds a **minimum ~1 s** spacing between API calls after the request completes, reducing provider hammering while a candle is forming or the market is quiet.

---

## [0.9.9] - 2026-04-02 - Drawing Setters, NAMESPACES_LIKE Subscripts & force_overlay Sync

### Fixed

- **NAMESPACES_LIKE subscripts (transpiler)**: Subscripts on dual-use builtins (`time[1]`, `time_close[1]`, etc.) now emit **`$.get(name.__value, n)`** instead of **`name.__value[n]`**, so lookback matches Pine Script / forward-array Series semantics.
- **Box / line coordinate setters**: `set_lefttop`, `set_rightbottom`, `set_xy1`, `set_xy2`, `set_left`, `set_right`, and related setters on **box** and **line** helpers now call **`_resolve()`** so Series-derived coordinates unwrap the same way as **`new()`** constructors.
- **`force_overlay` on drawing objects**: **`syncToPlot()`** in **BoxHelper**, **LineHelper**, and **LabelHelper** routes **`force_overlay=true`** objects into **separate overlay plots** so chart integrations can place them on the main price pane.

### Added

- **Tests**: `box-setters-resolve`, namespace subscript transpiler coverage, and **gradient `fill()`** cases.

---

## [0.9.8] - 2026-03-27 - TA Cross/CrossUnder, Matrix·Vector, Plot Serialization & Input Fixes

### Fixed

- **`ta.crossover` / `ta.crossunder`**: Boundary comparison now uses inclusive `<=` / `>=` where TradingView expects equality at the crossing bar (replaces strict `<` / `>`). Verified against TradingView reference logs.
- **`matrix.mult` (vector operand)**: Multiplying a matrix by a row/column vector now returns a **`PineArrayObject`** instead of a **`PineMatrixObject`**, matching Pine Script semantics and fixing polyline-style indicators (e.g. Spline Quantile Regression).
- **`plotchar` Signature**: Corrected `PLOTCHAR_SIGNATURE` so the **`char`** argument is in the proper parameter slot for dynamic `plotchar` calls.
- **`TYPE_CHECK.color`**: Accepts **Series-wrapped** color values so colors passed through variables are not rejected and lost at runtime.
- **`color.new` / `color.rgb`**: NaN / invalid transparency no longer produces malformed hex strings (e.g. `#787b86NAN00`).
- **Bool `input`**: Fixed bool input default/coercion edge cases.
- **UDT Return from User Functions**: Fixed user-defined functions that return a UDT instance.
- **Drawing Object Serialization / `context.plot`**: Plot serialization avoids **circular references** when drawing objects are present.

---

## [0.9.7] - 2026-03-23 - Alerts, Fill & Drawing Fixes, OOB Warnings (TV-Aligned)

### Added

- **`alert()` / `alertcondition()`**: Full runtime support for `alert()` and `alertcondition()` — messages, frequencies, and event emission through the context. Transpiler injects **callsite IDs** on alert calls so multiple alerts with the same text or different frequencies are tracked independently (mirrors plot callsite IDs).
- **`Context.warnings` & `context.warn()`**: Non-fatal runtime warnings (e.g. array/matrix index out of range) are collected per bar instead of throwing. **`runLive()`** subscribers can listen for `'warning'` events alongside `'data'` and `'error'`.
- **Documentation**: New `docs/data-providers.md` (FMP, Alpaca, Binance, Mock, array-based data). Updates to precision docs, architecture overview, getting started, and initialization guides.

### Fixed

- **Array/Matrix Out-of-Bounds — TV Behavior**: Out-of-range `array.*` / `matrix.*` access no longer throws `PineRuntimeError` by default; it logs a warning via `context.warn()`, returns `na` / no-op, and keeps the script running (matches TradingView).
- **`fill()` & `force_overlay`**: `fill(plot1, plot2, ...)` now respects `force_overlay` so fills follow overlay vs sub-pane placement correctly.
- **Linefill Color Parsing**: Fixed incorrect parsing / application of linefill colors from Pine options. (fix issue #167)
- **Tuple Destructuring**: Fixed edge cases in tuple destructuring (transpiler / parser) that broke certain assignment patterns.
- **Drawing Object Default Overlay**: Label, line, linefill, box, and polyline helpers now default `overlay` from `context.indicator?.overlay` instead of hardcoded `true`, so drawings align with the hosting indicator’s pane.
- **Named Options vs `null`**: Added `arg !== null` guard when detecting named option objects — `null` from `color(na)` and similar no longer gets misclassified as a named-args object.
- **Numeric Precision & Equality Docs**: Tweaked `math.__eq` / `math.__neq` and serializer precision handling; documentation and examples updated for consistent decimal places.
- **Sourcemap Drift**: Fixed browser dev bundle sourcemaps so stack traces map reliably to TypeScript sources.

---

## [0.9.6] - 2026-03-14 - Runtime Error Handling, Loop Guard, Array Fixes & New Market Data Providers

### Added

- **`FMPProvider (beta)`** (Financial Modeling Prep): New provider for US equities, ETFs, crypto and forex via the FMP REST API. Supports daily (EOD) and intraday timeframes (1m–4h, paid plans). Configures with `Provider.FMP.configure({ apiKey: '...' })`.
- **`AlpacaProvider (beta)`**: New provider for US equities and ETFs via Alpaca Markets. Supports minute through monthly timeframes with cursor-based pagination (up to 10 000 bars/page). Configures with `Provider.Alpaca.configure({ apiKey: '...', secretKey: '...' })`.
- **`BaseProvider` Abstract Class**: New shared base class for all providers. Handles `closeTime` normalization, fail-early API key validation, and **automatic candle aggregation** — when a requested timeframe is not natively supported, `BaseProvider` selects the best available sub-timeframe, fetches sub-candles, and aggregates them transparently. `BinanceProvider` and `MockProvider` have been refactored to extend it.
- **Candle Aggregation Engine** (`src/marketData/aggregation.ts`): New module with `selectSubTimeframe()`, `aggregateCandles()`, and `getAggregationRatio()`. Supports fixed-ratio aggregation for intraday timeframes and calendar-based grouping for weekly/monthly bars.
- **`PineRuntimeError`**: New exported error class with a `method?: string` property. Thrown on Pine Script runtime violations (out-of-bounds access, loop limit exceeded). Distinguishable from general JS errors via `instanceof`.
- **`PineTS.setMaxLoops(n)`**: Configures the maximum iterations allowed per loop (default 500 000, matching TradingView's limit). Exceeding it throws a `PineRuntimeError`.
- **Loop Guard Injection**: The transpiler injects a counter + guard at the top of every `for`/`while` body, preventing runaway loops from hanging the runtime.
- **Negative Array Indices (Pine Script v6)**: `array.get`, `array.set`, `array.insert`, `array.remove`, `matrix.get`, `matrix.set` now accept negative indices (`-1` = last element).

### Fixed

- **Stored Numbers Precision**: `$.set()` now applies `context.precision()` when writing a number into a Series, preventing floating-point drift from accumulating across bars.
- **User Functions Returning Tuples with Complex Expressions**: `transformReturnStatement` was not walking into binary, unary, call, logical, or conditional expression nodes inside tuple arrays. Expressions like `_mid + _dev * mult` or `-_val` were left with bare identifiers, producing wrong values at runtime.
- **Array/Matrix Out-of-Bounds Reporting**: `array.get/set/insert/remove` and `matrix.get/set/row/col` now throw a `PineRuntimeError` when an index (after negative normalization) is still out of bounds, replacing the previous silent `NaN`/`undefined`.
- **Weak integer check fixed** previously using ((valus | 0) == value) now using Number.isInteger(value)

---

## [0.9.5] - 2026-03-12 - Time & Timezone Fixes

### Added

- **`PineTS.setTimezone(timezone)`**: Display-only chart timezone (like TradingView's timezone picker). Accepts IANA names, `UTC±N` offsets, or `'UTC'`. Only affects `log.*` timestamp formatting — computation functions (`timestamp()`, `hour`, `dayofmonth`, `time_tradingday`, etc.) always use the exchange timezone from `syminfo.timezone`.

### Fixed

- **`closeTime` Normalization**: `BinanceProvider` and `MockProvider` now normalize `closeTime` to the TradingView convention (`closeTime = nextBar.openTime`) instead of Binance's raw `nextBarOpen - 1ms`. `IProvider` docs updated to specify this convention. For array-based data missing `closeTime`, `PineTS` now estimates it as `openTime + timeframe duration` (falls back to 1D when unknown).
- **`time_tradingday` Uses Close Date**: Was returning midnight UTC of the bar's open date. Now correctly returns midnight UTC of the **close date** (matching TradingView). E.g. a weekly bar opening `2019-01-07` → closes `2019-01-14` → `time_tradingday = 2019-01-14 00:00 UTC`.
- **`timestamp(dateString)` Exchange Timezone**: Date strings like `"2019-06-10 00:00"` were parsed in the host system's local timezone. Now explicitly resolved in the exchange timezone (`syminfo.timezone`), matching TradingView behaviour. Strings with explicit offsets or `Z` are honoured as-is.
- **`TimeHelper` as `Series`** ([#156](https://github.com/QuantForgeOrg/PineTS/issues/156)): `Series.from()` now unwraps NAMESPACES_LIKE dual-use objects (`time`, `time_close`, etc.) by detecting the `.__value` Series property, instead of wrapping the object itself. Added a null-guard to prevent a crash when the source is `null`. (contribution by [@dcaoyuan](https://github.com/dcaoyuan))
- **`Log` Timestamps Use Chart Timezone**: `log.info/warning/error` hardcoded UTC for bar timestamp prefixes. They now respect the timezone set via `setTimezone()`, falling back to the exchange timezone.
- **`Etc/UTC` Alias**: Added `'Etc/UTC'` to the fast-path UTC check in `getDatePartsInTimezone()`, fixing date-part calculations for providers that use the canonical `Etc/UTC` identifier (common for crypto).
- **`ta.vwap` Session Timezone**: VWAP day-boundary detection now uses `getDatePartsInTimezone(openTime, syminfo.timezone)` instead of `toISOString().slice(0, 10)`, so session resets are correct for non-UTC exchanges.

---

## [0.9.4] - 2026-03-11 - Color Namespace, Transpiler Overhaul, request.security & Drawing Improvements

### Added

- **`color` Namespace Refactor**: Extracted the full color implementation from `Core.ts` into a dedicated `src/namespaces/color/PineColor.ts` module. Adds complete `COLOR_CONSTANTS` (all named palette colors), improved hex/rgb/rgba/`#RRGGBBAA` parsing, `color.from_gradient()` with NaN guard, and a full test suite.
- **`alert()` Stub**: Added the missing `alert()` function (previously only `alertcondition` existed). Emits to the context event bus so downstream code can subscribe without crashing.
- **`max_bars_back()` No-Op**: Added `max_bars_back(source, length)` as a compatibility stub. Returns its source argument unchanged (PineTS maintains full history, so there is no lookback cap to configure).
- **`linefill` Instance Methods**: `LinefillObject` now exposes `get_line1()`, `get_line2()`, and `set_color()` directly on the instance, enabling UDT field-chain patterns like `myStruct.fill.set_color(c)`.
- **UDT `.new()` Named Arguments**: `MyType.new(field1=val1, field2=val2)` now works correctly. The UDT constructor detects a named-argument object and maps keys to fields instead of positional assignment.
- **`linefill.new` Thunking**: Added `linefill.new` to `FACTORY_METHODS` so it receives the arrow-function thunk treatment in `var` declarations, preventing orphaned linefill objects from being created on every bar.
- **`math.__neq()` — Inequality Operator**: Added `math.__neq(a, b)` to handle Pine Script's `!=` / `<>` operator with proper NaN semantics (mirrors `math.__eq`).

### Fixed

#### Transpiler

- **For-Loop Init & Update `$.get()` Wrapping**: The for-loop init and update expressions lacked `addArrayAccess`, `MemberExpression`, and `CallExpression` handlers. Series variables appearing in loop bounds (e.g., `for i = 0 to bar_index - 1`) were left as raw Series objects, causing the update ternary to evaluate to `NaN` and producing infinite loops or bodies that never executed.
- **While-Loop Test Condition**: `while bar_index > cnt` and similar conditions with Series variables were not wrapped in `$.get()`, so the comparison always evaluated against a raw Series object (→ `NaN`). Fixed by adding missing `addArrayAccess` and namespace-object skip logic to `transformWhileStatement`.
- **Function-Scoped Variable Resolution**: Added `isVariableInFunctionScope()` to `ScopeManager`. `createScopedVariableReference()` now correctly resolves `var` declarations inside nested `if`/`for` blocks _within_ functions to the local context (`$$`) instead of the global context (`$`).
- **Optional Chaining for `na` UDT Drawing Fields**: `hasGetCallInChain()` now traverses `MemberExpression` _and_ intermediate `CallExpression` nodes to detect `$.get()` in deeper chains. Inserts `?.` on the final method call so `myStruct.line?.set_x2(x)` does not crash when the field is `na`/`undefined`.
- **User Function vs Method Call Disambiguation**: Added `isChainedPropertyMethod` guard — when the callee object is itself a `MemberExpression` (e.g., `myObj.x.set()`), the call is not mistakenly redirected through `$.call()` even if `set` happens to be a user-defined function name. Added `_skipTransformation = true` on function-reference identifiers inside `$.call()` to prevent them from resolving to same-named variables.
- **`hasGetCallInChain()` Chain Expression Traversal**: Extended to walk through `ChainExpression` wrapper nodes (`?.` optional chains) so already-wrapped intermediate nodes are also checked when determining whether to insert optional chaining.
- **`ReturnStatement` Walk-Through**: `MainTransformer`'s `ReturnStatement` handler now recurses into complex return arguments when not in function scope, preventing untransformed expressions in nested return statements.
- **`parseArgsForPineParams` NaN Handling**: Fixed dynamic Pine Script signatures passing `NaN` values through the argument normalizer, which caused downstream `isNaN` checks to misidentify valid numeric `0` values.
- **Await Propagation in User-Defined Functions**: Functions containing `request.security` calls (which are async internally) now correctly propagate `async`/`await` through the function declaration, preventing unresolved Promise objects from reaching callers.
- **Tuple Destructuring in User Functions**: Fixed the Pine Script parser emitting single-bracket `[a, b]` returns instead of the required double-bracket `[[a, b]]` tuple form when `=>` arrow functions ended with an `if/else` that returned a tuple.
- **Function Parameter Namespace Collision Renaming**: Parameters whose names collide with built-in namespaces (e.g., a parameter named `color`) were being looked up as namespace objects instead of local variables. The transpiler now renames such parameters to avoid the collision.
- **ArrayExpression Function Parameter Scoping**: Function parameters used inside array literal arguments (e.g., `[output, ...]`) were incorrectly resolved to the global scope (`$.let.output`) instead of the local raw identifier (`output`). Added `isLocalSeriesVar` check in `ExpressionTransformer`.
- **Switch Statement Tuple Destructuring**: IIFE array returns inside switch branches were not wrapped in the required `[[a, b, c]]` double-bracket form, causing `$.init()` to treat the tuple as a time-series and extract only the last element.
- **Array/Matrix Typed Declarations**: The Pine Script parser now correctly parses `array<float>`, `matrix<int>`, and other generic typed declarations in variable declarations and function signatures. Strong-typing tests cover all primitive and object element types.

#### Runtime

- **`plotcandle` and `barcolor`**: Fixed incorrect argument mapping and color resolution in both functions. `barcolor` now correctly applies per-bar color overrides to the candlestick series, and `plotcandle` produces properly structured OHLC plot data.
- **`request.security` Expression Handling**: Complex expressions passed as the `expression` argument (not just simple identifiers or plot references) now evaluate correctly in the secondary context. Also fixed user-defined method expressions being passed across context boundaries.
- **`request.security_lower_tf` Pine Script Behavior**: Rewrote lower-timeframe (LTF) aggregation to match TradingView's behavior — values are collected as intra-bar arrays, and the correct array element (first vs. last vs. all) is returned depending on `lookahead` / `gaps` settings.
- **Normalized Timeframes**: `timeframe.in_seconds()` and related utilities now correctly handle all non-canonical formats (`'1h'`→`'60'`, `'1d'`→`'D'`, `'1w'`→`'W'`) and return `NaN`/`0` when given `undefined` or an unrecognised string.
- **Plot Color Change Detection**: Fixed false positives in the plot color-change detector that caused unnecessary re-renders when the color value was numerically identical but represented by different intermediate Series wrappers.
- **`str.split()` Returns Pine Array**: `str.split()` was returning a plain JavaScript array. It now returns a `PineArrayObject` so array namespace methods (`.get()`, `.size()`, etc.) work on the result.
- **Label Colors & Backgrounds**: Fixed `label.set_textcolor()` and `label.set_bgcolor()` not applying when called after construction, and resolved parsing inconsistencies in `parseArgsForPineParams` that treated valid color `0` as `na`.
- **`color.from_gradient` NaN Guard**: Added `null`/`NaN`/`undefined` guards for all five arguments; previously a missing value produced `#NANNANNAN` hex strings.
- **Improved Color Parsing**: `PineColor` now handles all Pine Script color representations uniformly: 6-digit hex, 8-digit hex (`#RRGGBBAA`), `rgb()`, `rgba()`, named constants, and `color.new()` output.
- **Polyline Rendering Fixes**: Fixed `polyline.new()` crash when `points` contained `na` entries, incorrect `xloc` handling for bar-index vs. time coordinates, and missing default line/fill colors.
- **Array `new_*` Capacity Handling**: `array.new<T>(size, initial)` variants now clamp the requested capacity to `MAX_ARRAY_SIZE` and correctly initialise all elements to the provided default (was previously initialising to `undefined` in some typed constructors).
- **Table Cell Null Guard**: `table.cell()` now guards against `null`/`undefined` row or column indices, preventing a crash when table access patterns involve conditional creation.
- **`chart.fg_color`**: Fixed `chart.fg_color` returning the wrong value (`bg_color` was returned for both properties due to a copy-paste error).
- **Default Colors for Polyline and Table**: `polyline.new()` and `table.new()` no longer require explicit color arguments; sensible defaults are applied when colors are omitted or `na`.
- **User Functions Treated as Native Functions**: Fixed a regression where user-defined functions registered in `settings.ts` were forwarded through the native namespace dispatcher instead of the user function call path.
- **Sourcemap Generation for Browser Dev Build**: Fixed the rollup sourcemap pipeline for the `build:dev:browser` target so browser DevTools correctly resolve transpiled runtime errors to TypeScript source lines.

---

## [0.9.3] - 2026-03-06 - Streaming Support, request.security Fixes, Transpiler Robustness

### Added

- **`array.new_box` / `new_label` / `new_line` / `new_linefill` / `new_table` / `new_color`**: Added the six missing typed array factory methods so `array<box>`, `array<label>`, etc. can be created with a proper element type. The auto-generator (`scripts/generate-array-index.js`) now lists them as static factory functions (called with context) rather than instance delegates. `isValueOfType` in `array/utils.ts` was extended to accept object values for these types, allowing `array.push(label.new(...))` on typed arrays.
- **`request.security` — Live Streaming Support**: `request.security` now correctly handles live (streaming) bar updates. The secondary context is re-evaluated on each tick, and `findSecContextIdx` resolves the correct intra-bar index for the current live bar. Paired with drawing-object rollback (see below), streaming ticks no longer produce duplicate drawing objects.
- **`str.tostring` Format Patterns**: Added support for Pine Script's named and pattern-based format strings: `"#"`, `"#.#"`, `"#.##"`, `"0.00"`, and the `format.*` named constants. The formatter now applies these patterns before falling back to `toString()`.

### Fixed

- **While-Loop Test Condition Hoisting** (infinite-loop crash): `array.size()` and similar calls in a `while` condition were being hoisted to a temp variable _outside_ the loop by the default CallExpression walker, making them one-shot evaluations and causing an infinite loop followed by a crash. `MainTransformer` now registers a `WhileStatement` handler and `transformWhileStatement` was rewritten to use a recursive walker with hoisting suppressed throughout the entire test condition.
- **Array Pattern Scoping Crash**: `isArrayPatternVar` was determined using a global (non-scoped) set in `ScopeManager`. A local function variable whose name happened to match an outer-scope destructured tuple element was falsely treated as an array pattern, causing a runtime crash. Fixed by adding a shape guard: the flag is only set when `decl.init` is a computed `MemberExpression` (the `_tmp_0[0]` pattern produced by the AnalysisPass destructuring rewrite).
- **For-Loop Namespace Wrapping** (`math.min` → `$.get(math, 0).min`): In the for-loop test condition walker, `MemberExpression` nodes unconditionally recursed into their object, causing the `Identifier` handler to wrap context-bound namespace objects (`math`, `array`, `ta`, …) with `$.get()`. Fixed by skipping recursion and `addArrayAccess` for identifiers that are the object of a `MemberExpression` and are context-bound namespaces.
- **`request.security` Cross-Timeframe Value Alignment**: `barmerge.gaps_off` / `barmerge.lookahead_off` were passed as strings; their truthiness caused `findLTFContextIdx` to take the wrong branch (returning the first intra-bar instead of the last). Fixed by converting barmerge string enums to booleans. Added `normalizeTimeframe()` to map non-canonical formats (`'1h'`→`'60'`, `'1d'`→`'D'`) so `isLTF` determination is correct. Fixed secondary context date-range derivation to use `effectiveSDate` from `marketData` and extend `secEDate` to cover the last bar's intra-bars.
- **`barmerge` Missing from `CONTEXT_BOUND_VARS`**: `barmerge.gaps_off` / `barmerge.lookahead_off` (used in `request.security()`) were not in the transpiler's context-bound list, so they were left as bare identifiers instead of being mapped to the runtime context. Added `'barmerge'` to `settings.ts`.
- **`barstate.isconfirmed` Wrong Bar**: Was checking whether the last bar's close time equalled the session close via `closeTime[length-1]` (always the last bar in history) instead of the currently-executing bar. Fixed to use `closeTime.data[context.idx]` for correct per-bar evaluation.
- **`array.get()` Out-of-Bounds → NaN**: `array.get(arr, -1)` and other out-of-bounds accesses returned `undefined` (native JS), causing crashes when Pine Script code accessed properties (e.g., `.strength`) on the result. The method now returns `NaN` (Pine's `na`) for negative or out-of-range indices.
- **Drawing Helpers — `na` Color Resolution**: Drawing object helpers' `_resolve()` method now detects `NAHelper` instances and returns `NaN`, fixing cases where `border_color=na` (and similar `na` arguments) were silently ignored in `box.new()`, `line.new()`, etc. `BoxHelper` also gains a dedicated `_resolveColor()` that preserves `NaN` instead of letting it fall through an `||` fallback to the default color.
- **Streaming Rollback for Drawing Objects**: All five drawing types (`box`, `line`, `label`, `linefill`, `polyline`) now track a `_createdAtBar` property and expose a `rollbackFromBar(barIndex)` method. `Context.rollbackDrawings()` calls this during `_runPaginated` / `updateTail` to remove any drawing objects created on the current streaming bar before re-running it, preventing duplicate objects from accumulating across live ticks.

---

## [0.9.2] - 2026-03-06 - Drawing Object Method Syntax, Gradient Fill, Matrix & Array Improvements

### Added

- **Method-Call Syntax on Drawing Instances**: `LineObject`, `LabelObject`, and `BoxObject` now carry delegate setter/getter methods directly on the instance (e.g., `myLine.set_x2(x)`, `myBox.set_right(r)`, `myLabel.set_text(t)`). Each delegate forwards to the owning helper so the plot sync (`_syncToPlot`) fires correctly. Enables Pine Script patterns where drawing objects stored in UDTs or arrays are mutated via method syntax.
- **Gradient Fill (`fill()`)**: Added support for Pine Script's gradient fill signature — `fill(plot1, plot2, top_value, bottom_value, top_color, bottom_color)`. The `FillHelper` detects the gradient form (third argument is a number) and stores per-bar `top_value`/`bottom_value`/`top_color`/`bottom_color` data for the renderer.
- **Typed Generic Function Parameters**: The Pine Script parser now correctly handles generic type annotations in function parameter lists (e.g., `array<float> src`, `map<string, float> data`). Previously these caused parse errors.

### Fixed

- **UDT Thunk Resolution for Drawing Object Fields**: When a `var` UDT instance contains fields initialised with factory calls (e.g., `line.new(...)`, `box.new(...)`), those fields are now correctly resolved as thunks on bar 0 inside `initVar`. Previously the thunk-wrapped factory results were stored as raw functions in the UDT field, causing the drawing object to never be created.
- **Typed Array Type Inference for Object Types**: `inferValueType()` no longer throws `"Cannot infer type from value"` when called with an object (e.g., a `LineObject` or `BoxObject`). It now returns `PineArrayType.any`, allowing `array<line>` and similar typed arrays to work correctly.
- **Non-Computed Namespace Property Access in `$.param()`**: Fixed `ExpressionTransformer` incorrectly wrapping namespace constant accesses (e.g., `label.style_label_down`, `line.style_dashed`) in `$.get()` calls when they appeared inside function arguments. The transformer now detects non-computed member access on `NAMESPACES_LIKE` identifiers and leaves them untransformed.
- **`histbase` Type in `PlotOptions`**: Fixed the `histbase` field in the `PlotOptions` TypeScript type from `boolean` to `number`, matching the actual Pine Script `plot(histbase=50)` signature.
- **For-Loop `MemberExpression` Recursion**: Fixed user variable identifiers inside method calls in `for` loops (e.g., `lineMatrix.rows()`) not being transformed. The `MemberExpression` visitor in `transformForStatement` now recurses into the object node after transformation so nested identifiers are correctly resolved.
- **Multiline `and` / Comparison Expressions**: Fixed the Pine Script parser dropping continuation lines in `and`/`&&` chains and comparison expressions spanning multiple lines. `skipNewlines(true)` is now called after the operator.
- **`matrix.inv()` — Full NxN Support**: Rewrote `matrix.inv()` from a 2×2-only implementation to Gauss-Jordan elimination with partial pivoting, supporting any square matrix. Singular matrices (pivot < 1e-14) return a NaN matrix.
- **`matrix.pinv()` — Real Pseudoinverse**: Rewrote `matrix.pinv()` from a placeholder stub to a correct Moore-Penrose pseudoinverse: square → `inv()`, tall (m > n) → `(AᵀA)⁻¹Aᵀ`, wide (m < n) → `Aᵀ(AAᵀ)⁻¹`.
- **`array.min()` / `array.max()` Performance**: Added an O(N) fast path for the common `nth=0` case instead of always sorting O(N log N).
- **`array.median()`, `percentile_linear_interpolation()`, `percentile_nearest_rank()` Performance**: Single-pass copy-and-validate optimizations.
- **`isPlot()` with Undefined Title**: Fixed `isPlot()` to accept plot objects that have `_plotKey` but no `title` property (e.g., fill plots created via callsite ID), preventing `fill()` from misidentifying its arguments (contribution by @dcaoyuan, [#142](https://github.com/QuantForgeOrg/PineTS/issues/142)).
- **Duplicate `map` in `CONTEXT_PINE_VARS`**: Removed an accidental duplicate `'map'` entry from `settings.ts`.

## [0.9.1] - 2026-03-04 - Enum Values, ATR/DMI/Supertrend Fixes, UDT & Transpiler Improvements

### Added

- **Enum Value Syntax (`Signal.Buy`)**: Full support for user-defined enum member access (e.g., `Signal.Buy`, `Direction.Long`). The transpiler now recurses into non-context-bound identifiers inside `MemberExpression` nodes, correctly resolving enum identifiers in return statements, if-test conditions, and operand positions.
- **Implicit Return for `=>` Arrow Functions with `if/else`**: The Pine Script parser now adds an implicit `return` when the last statement of a `=>` function body is an `if/else` block, matching Pine Script's expression-based semantics.

### Fixed

- **ATR Stale `prevClose`**: Fixed `ta.atr` using a stale previous close value when called conditionally. Replaced state-tracked `prevClose` with a direct `context.get(context.data.close, 1)` read, ensuring ATR always uses the actual previous bar's close.
- **ATR / DMI / Supertrend Backfill**: Fixed backfill for `ta.atr`, `ta.dmi`, and `ta.supertrend` when called inside conditional blocks. When `context.idx >= period` but the function hasn't accumulated enough calls (due to conditional execution), values are now computed from historical data directly — matching the backfill pattern used by other window-based TA functions.
- **`ta.param()` Hardcoded Index**: Fixed `ta.param()` functions across several TA methods that were using a hardcoded `0` index instead of the actual passed index, causing incorrect lookback reads.
- **`bar_index` as a Series**: Fixed `bar_index` to be handled correctly as a Series value throughout the runtime, ensuring lookback access (`bar_index[1]`) works as expected.
- **`array.new<UDT>(size)` Type Inference**: Fixed type inference for `array.new<UDT>(0)` when only a size argument is provided (no `initial_value`). The array element type was not being inferred in this case.
- **UDT Field Defaults in Codegen**: Fixed fields with expression defaults (e.g., `float upper = hl2`) not generating the correct `['type', default]` pair in the `Type()` constructor call, causing incorrect UDT instantiation.
- **Member Expression Chains on `var` Variables**: Fixed complex member expression chains like `holder.get(k).trend` not resolving correctly when `holder` is a `var`-declared variable.
- **`na()` Crash on UDT Objects**: Fixed `na()` crashing when called on UDT objects with circular references. `JSON.stringify` was replaced with a safer check.
- **UDT Defaults Lost by `$.param()` Wrapping**: Fixed `$.param(['float', 0])` wrapping the `[type, default]` array in a Series, causing `Type()` to fail to detect the pair structure.
- **`array.indexof(NaN)` Returns `-1`**: Fixed `array.indexof` returning `-1` for `NaN` values because JavaScript's `Array.indexOf` uses `===` which never matches `NaN`. The method now uses `Number.isNaN` for correct detection.
- **`MemberExpression` Missing `$.get()` in Call Args**: Fixed member expressions on Series variables (e.g., `get_spt.output`) inside binary expressions used as function arguments being transpiled as `$.let.glb1_get_spt.output` (a Series object) instead of `$.get($.let.glb1_get_spt, 0).output` (the current bar's value).
- **Table Fixes**: Fixed several issues in the `table.*` namespace implementation.
- **Polyline Named Arguments**: Fixed `polyline.new()` not correctly parsing named arguments.
- **Polyline Points from Series**: Fixed `polyline.new()` not correctly extracting `chart.point` values when points are stored in a Series.
- **Plot Default Color**: Fixed plots not falling back to a default color when no color is specified.
- **`hline` Options Consistency**: Fixed inconsistent evaluation of `hline()` options (contribution by @dcaoyuan, PR #134).
- **Missing `enum` Extend**: Fixed missing `extend` handling for enum declarations (contribution by @dcaoyuan, PR #137).

## [0.9.0] - 2026-02-27 - Box, Table & Polyline Namespaces, Pine Script Compliance & Critical Fixes

### Added

- **Box Namespace (`box.*`)**: Full implementation of the box drawing namespace — `box.new()`, `box.copy()`, `box.delete()`, and all setter/getter methods (`set_left`, `set_right`, `set_top`, `set_bottom`, `set_bgcolor`, `set_border_color`, `set_border_width`, `set_border_style`, `set_text`, `set_text_color`, `set_text_size`, `set_extend`, etc.).
- **Table Namespace (`table.*`)**: Full implementation of the table drawing namespace — `table.new()`, `table.cell()`, `table.delete()`, and cell/table setter methods. Tables are positioned at fixed screen locations (`position.top_left`, `position.bottom_center`, etc.) and rendered as DOM overlays in QFChart.
- **Polyline Namespace (`polyline.*`)**: Implementation of `polyline.new()` for rendering multi-point connected paths from arrays of `chart.point` objects, with support for curved lines, closed shapes, and fill color.
- **Primitive Type Declarations**: Added support for `int()`, `float()`, and `string()` cast/conversion expressions in Pine Script syntax (e.g., `x = int(someValue)`).
- **`enum` Keyword Support**: Added `enum` keyword handling in the transpiler for Pine Script v6 enum declarations.
- **Test Coverage**: Comprehensive new test suites — `box.test.ts`, `table.test.ts`, `polyline.test.ts`, `linefill.test.ts`, `fill.test.ts`, `hline.test.ts`, `line.test.ts`, `plot.test.ts`, `constants.test.ts`, `request.test.ts`, `ta-backfill.test.ts`, `parser-fixes.test.ts` (1000+ new test cases).

### Changed

- **Type Name Compliance**: Renamed internal type constant names to match Pine Script's naming convention exactly. Aligned string constants across label styles, line styles, shape types, and size presets so PineTS output is directly compatible with QFChart renderers without manual mapping.

### Fixed

- **`na == na` Equality**: Fixed `na == na` to correctly return `false` in Pine Script (unlike `NaN === NaN` in JavaScript which is also `false`, but the equality transpilation path was not applying `__eq()` consistently in all cases).
- **TA Backfill in Conditional Closures**: Fixed backfill logic for `ta.*` window-based functions (`sma`, `highest`, `lowest`, `stdev`, `variance`, `dev`, `wma`, `linreg`, `cci`, `median`, `roc`, `change`, `alma`) when the function call is inside a conditional block (e.g., `if someCondition => ta.sma(...)`). Previously, the source-series backfill would fail because the method wasn't being called on bars where the condition was false, leaving the window incomplete.
- **TA Function-Variable Hoisting**: Fixed `ta.obv`, `ta.tr`, and other TA function-variables that behave as both a function call and a variable. These must be evaluated on every bar — even when referenced inside a conditional block — to maintain accurate rolling state. They are now hoisted to the top of the context function.
- **RSI Fix**: Fixed RSI calculation accuracy for edge cases.
- **`math.round` Compliance**: Fixed `math.round` to match Pine Script's rounding behavior (rounds half away from zero, matching Pine's `math.round()` semantics rather than JavaScript's `Math.round()` which rounds half towards positive infinity).
- **`request.security` — `syminfo.tickerId`**: Fixed `request.security` to correctly parse `syminfo.tickerId` when it contains the provider prefix (e.g., `"BINANCE:BTCUSDT"`), stripping the provider ID before lookup.
- **`request.security` — Tuple Returns**: Fixed `request.security` to correctly unwrap and return tuple values from the secondary context.
- **Transpiler — Multi-Level Nested Conditions**: Fixed transpiler handling of deeply nested `if/else if/else` chains that span multiple indentation levels.
- **Transpiler — IIFE Statements**: Fixed handling of already-transformed IIFE (Immediately Invoked Function Expression) nodes to prevent double-transformation.
- **Transpiler — Switch/Case Edge Cases**: Fixed several edge cases in switch statement transpilation including missing default cases and complex multi-line case bodies.
- **`color.*` Fixes**: Fixed several `color.*` function edge cases for correct RGBA string generation.

## [0.8.12] - 2026-02-27 - Line & Linefill Namespaces, Plot Callsite IDs, Fill Support

### Added

- **Line Namespace (`line.*`)**: Full implementation of the line drawing namespace including `line.new()`, `line.copy()`, and all setter/getter methods (`set_x1`, `set_y1`, `set_x2`, `set_y2`, `set_color`, `set_width`, `set_style`, `set_extend`, etc.).
- **Linefill Namespace (`linefill.*`)**: Implementation of `linefill.new()` for filling the area between two line objects, with `set_color`, `get_color`, `delete`, and related methods.
- **Fill Support (`fill()`)**: Implementation of the `fill()` function for filling areas between plots and hlines.
- **Plot Callsite IDs**: Transpiler now injects unique callsite IDs (`{__callsiteId: "#N"}`) for every `plot()`/`hline()`/`fill()` call to handle duplicate plot titles ([#110](https://github.com/QuantForgeOrg/PineTS/issues/110)).
- **Transpiler Dotted Types**: Added support for dotted type annotations in Pine Script (e.g., `chart.point`, `line`).

### Fixed

- **Plot Title Collisions**: Multiple plots with the same title no longer overwrite each other; collisions are resolved with human-readable `title#N` keys ([#110](https://github.com/QuantForgeOrg/PineTS/issues/110)).
- **Var Declaration Side Effects**: Factory method calls (e.g., `line.new()`, `line.copy()`) in `var` declarations are now deferred via arrow function thunks to prevent orphan object creation on every bar.
- **Array Initialization**: Fixed `array.new<type>()` with no arguments (e.g., `array.new<chart.point>()`).
- **Label & Line Value Resolution**: Values passed to label and line setters can now be Series, bound functions, or plain scalars — all are correctly resolved.
- **For Loops Runtime Direction**: Added support for for loops where the iteration direction is determined at runtime.

## [0.8.11] - 2026-02-21 - Time Functions, Log Timezone, Transpiler & TA Window Fixes

### Added

- **Time Functions**: Added support for `time`, `time_close`, and `timestamp`, plus time component functions: `dayofmonth`, `dayofweek`, `weekofyear`, `year`, `month`, `hour`, `minute`, `second`.
- **Log Timezone**: Updated `log.*` namespace to support timezone; logs use UTC time (to be revisited later).
- **Automated Tests**: Prepared advanced automated test suite; updated `builtin.json` and related test data.

### Changed

- **Constant-Like Functions**: Refactored transpiler handling of functions that behave like constants (e.g. `time`, `time()`, `na`, `na()`). Previously only `na` was supported and hardcoded; the solution is now generalized for such built-ins.
- **Documentation**: Documentation updates.

### Fixed

- **Transpiler Array Access in Function Arguments**: Fixed a bug where inline array access inside function arguments (e.g., `nz(a[b], a)`) produced wrong results. The transpiler was passing the index as a Series reference instead of unwrapping it to a scalar value via `$.get()`. This caused `$.param()` to receive a Series object as the index, leading to incorrect offset calculations.
- **TA Rolling Window with Dynamic Lengths**: Fixed all window-based TA functions (`ta.lowest`, `ta.highest`, `ta.sma`, `ta.ema`, `ta.stdev`, `ta.bb`, `ta.bbw`, `ta.cci`, `ta.dev`, `ta.wma`, `ta.vwma`, `ta.alma`, `ta.swma`, `ta.hma`, `ta.linreg`, `ta.median`, `ta.variance`, `ta.change`, `ta.roc`) to correctly handle dynamic window lengths. Previously, the window trimming used `if` (single pop) instead of `while` (trim to target), leaving stale values when the length decreased by more than one between bars.
- **TA Rolling Window Recovery**: Added source-series backfill to all window-based TA functions. When a dynamic length shrinks then grows, the window now recovers missing historical values from the source series instead of returning NaN. Functions that intentionally exclude NaN from their windows (`ta.stdev`, `ta.bb`, `ta.bbw`, `ta.cci`) correctly stop backfilling at NaN boundaries.

## [0.8.10] - 2026-02-21 - Chart & Label Namespaces, For-Loop Fix

### Added

- **Chart and Label Namespaces**: Added support for `chart.*` and `label.*` namespaces (pull request #116).
- **Data Providers**: Added `configure` method to data providers for runtime configuration.

### Fixed

- **For-Loop Transpiler**: Fixed call expressions not being properly handled in for-loop contexts.

## [0.8.9] - 2026-02-15 - Pine Script Parser & Compatibility Fixes

### Fixed

- **Typed Variables Declaration**: Fixed typed variables declaration and untyped bracket arrays for Pine Script v5 compatibility.
- **TA highest/lowest**: Fixed `ta.highest` and `ta.lowest` so the first argument can be `_length` (contribution by @dcaoyuan).
- **Standard Colors**: Removed colors that are not in Pine's standard color list (contribution by @dcaoyuan).

## [0.8.8] - 2026-02-09 - Community Contributions & Fixes

### Fixed

- **Color Conversion**: Fixed color conversion for `color.new()` to correctly generate `rgba()` strings (contribution by @dcaoyuan).
- **Parser Comments**:
    - Fixed parser to allow comments between `if` block and `else` (contribution by @C9Bad).
    - Fixed parser to allow inline comments after type fields (contribution by @C9Bad).
- **TA Bollinger Bands**: Fixed `ta.bb` return order to be `[middle, upper, lower]` to match Pine Script behavior (contribution by @dcaoyuan).

## [0.8.7] - 2026-02-08 - Pine Script Transpiler Enhancements & Fixes

### Added

- **Tuple Support**: Added support for tuple destructuring in `for...in` syntax (e.g., `for [a, b] in array`).
- **Unit Tests**: Added comprehensive unit tests for switch statement transpilation and unary operator handling.

### Fixed

- **For Loops**: Fixed transpiler bugs with Pine Script array iteration:
    - Fixed `for...in` syntax when using Pine Script arrays.
    - Fixed `for...of` syntax handling in PineTS syntax, including destructuring support (e.g., `for [i, x] in arr`).
    - Fixed function/variable name collision issues in loop contexts.
- **Method Call Syntax**: Fixed method call syntax for user-defined functions (e.g., `obj.method()` where `method` is a user function). The transpiler now correctly transforms these into function calls `method(obj, ...args)`.
- **Method Chains**: Fixed AST traversal for method chains (e.g., `func(arg).method()`) to ensure arguments in the chain are correctly transformed.
- **Switch Statement**: Fixed multiple issues with switch statement transpilation:
    - Fixed switch expression when used outside of a function.
    - Fixed generated IIFE (Immediately Invoked Function Expression) for switch statements.
    - Fixed multi-line switch body handling.
    - Improved switch syntax conversion in Pine Script to PineTS transpiler.
- **Unary Operators**: Fixed transpiler to properly transform function calls within unary expressions (e.g., `!func()`). (contribution by @dcaoyuan)
- **Matrix Operations**: Fixed matrix operations transpilation issues.
- **Linter Fixes**: Resolved TypeScript linter errors in transformer code.

### Changed

- **Pine Script Parser**: Enhanced Pine Script to JavaScript transpiler phase with improved error handling and syntax support.

## [0.8.6] - 2026-01-27 - Binance Data Provider Hotfixes

### Fixed

- **Binance Provider** : Wrong handling of stream data when sDate and eDate are not provided

## [0.8.5] - 2026-01-27 - Transpiler Hotfixes

### Fixed

- **Deprecation Warnings**: Fixed wrong warning message appearing with valid code.
- **Pine Script Parser**: Fixed multiline Pine Script conditions parsing (indent error).
- **Transpiler**: Fixed `switch` statement syntax conversion.

## [0.8.4] - 2026-01-24 - Math Namespace Enhancements & Critical Fixes

### Added

- **Math Namespace**: Added `math.todegrees` and `math.toradians` functions. (contribution)

### Fixed

- **Math Namespace**: Fixed `math.precision` implementation and `math.round` precision parameter handling.
- **Variable Scope Collision**: Fixed critical issue where local variables (`var`, `let`, `const`) in user-defined functions were sharing state across different function calls. Implemented dynamic scoping using unique call IDs to ensure each function instance maintains isolated state and history.
- **SMA NaN Handling**: Improved `ta.sma` to correctly propagate `NaN` values and handle `NaN` contamination in the rolling window by falling back to full recalculation when necessary.
- **Transpiler Optimization**: Major optimization of user-defined function transpilation. Introduced local context (`$$`) for scoping variables, reducing transpiled code complexity and improving readability by removing redundant `_callId` argument passing.
- **Array Access in Expressions**: Fixed a bug in the transpiler where array access inside expressions (e.g. ternary operators) could use incorrect static scope keys.

## [0.8.3] - 2026-01-13 - Transpiler Critical Fixes

### Fixed

- **Scientific Notation Parsing**: Fixed Pine Script lexer to correctly parse scientific notation literals (e.g., `10e10`, `1.2e-5`, `1E+5`). Previously, these were incorrectly tokenized as separate tokens, causing syntax errors in transpiled code.
- **Namespace Function Calls in Return Statements**: Fixed critical bug where namespace function calls (e.g., `math.max()`, `ta.sma()`) in single-expression return statements were incorrectly transpiled with double parentheses (e.g., `math.max()()`), resulting in runtime errors. Removed redundant AST traversal in `transformReturnStatement`.

## [0.8.2] - 2026-01-13 - Plot Fill Method & Transpiler Fixes

### Added

- **Plot Fill Method**: Implemented `plot.fill()` method to fill the area between two plot lines with customizable colors and transparency.

### Fixed

- **Transpiler Variable Names Collision**: Fixed variable name collision issues in the transpiler that could cause incorrect variable renaming and scope conflicts.
- **Logical Expressions in Function Arguments**: Fixed handling of logical expressions (e.g., `&&`, `||`) when passed as arguments to functions, ensuring proper evaluation and transpilation.

## [0.8.1] - 2026-01-11 - Transpiler hotfix

### Fixed

- **Transpiler Math Operations**: Fixed operator precedence issue where parentheses were lost in complex arithmetic expressions (e.g., `(a + b) * c` becoming `a + b * c`).

## [0.8.0] - 2026-01-10 - Runtime Inputs & UDT Transpiler Fix

### Added

- **Runtime Indicator Inputs**: New `Indicator` class to pass custom input values at runtime. Create indicators with `new Indicator(source, inputs)` and pass them to `PineTS.run()`. Input values override default values from `input.*` declarations.
- **Input Resolution**: Enhanced `input.*` namespace methods to resolve values from runtime inputs via `context.inputs`, falling back to default values when not provided.

### Fixed

- **PineScript UDT Transpilation**: User-defined types (`type` keyword) now correctly transpile to `Type({...})` syntax instead of JavaScript classes, ensuring compatibility with PineTS runtime.

## [0.7.9] - 2026-01-06 - User Function Call ID Fix

### Fixed

- **Critical Transpiler Fix**: Resolved cache collision bug in user-defined functions containing `ta.*` calls. Implemented context stack mechanism (`$.pushId()`, `$.peekId()`, `$.popId()`) to manage unique call IDs without explicit arguments, preventing state corruption and argument shifting issues with default parameters.

## [0.7.7] - 2025-01-03 - Live Streaming Support

### Added

- **PineTS.stream() Method**: Event-driven wrapper of `PineTS.run()` to simplify handling live data and real-time updates
- Documentation updates for streaming functionality

### Fixed

- **Critical Fix**: Live data processing was producing wrong values in `ta.*` functions due to incorrect handling of current vs committed candles

## [0.7.6] - 2025-12-30 - Additional Plot Functions

### Added

- **Plot Functions**: Added support for additional Pine Script plot functions:
    - `plotbar()` - Renders OHLC data as traditional bar charts with horizontal ticks
    - `plotcandle()` - Renders OHLC data as candlesticks with filled bodies and wicks
    - `bgcolor()` - Fills the chart background with colors based on conditions
    - `barcolor()` - Colors the main chart candlesticks based on indicator conditions

### Changed

- Enhanced `Plots` namespace with support for OHLC array values and color application to main chart
- Updated API coverage documentation to reflect new plot functions

## [0.7.5] - 2025-12-29 - UDT Support

### Added

- Support for User defined types

## [0.7.4] - 2025-12-27 - Plot styles fix + PineScript transpiler coverage

### Added

- Unit-tests for PineToJS transpiler branch bringing the total coverage back to > 80%

### Fixed

- plot styles were missing in the generated code (e.g plot.style_columns ...etc )

## [0.7.3] - 2025-12-24 - Plot Functions & PineScript Types Enhancement

### Added

- **Plot Functions**: Added support for `plotshape` and `plotarrow` functions
- **PineScript Type Constants**: Full implementation of PineScript type namespaces:
    - `format.*` - Number format types
    - `plot.*` - Plot style types
    - `location.*` - Location constants for shapes
    - `size.*` - Size constants for shapes
    - `shape.*` - Shape style constants
    - `display.*` - Display mode constants

## [0.7.2] - 2025-12-22 - Binance Provider Hotfix

- Hotfix : Binance provider failing for USA users, implemented a fallback logic to use the default binance url and fallback to US local url if the first one fails.

## [0.7.0] - 2025-12-20 - Pine Script Parser & Build System Modernization

### Added

- **Pine Script Parser/Converter**: Initial implementation of native Pine Script parser that automatically detects and converts Pine Script v5 and v6 source code into PineTS executable code. PineTS.run(source) can now run a native PineScript source.
- **Async Statement Handling**: Graceful handling of async statements (e.g., `request.security`) declared in PineTS syntax without explicit `await`, bringing PineTS syntax closer to native Pine Script
- **Test Coverage**: New comprehensive unit tests covering the PineTS transpiler
- **Namespace Documentation**: Added detailed documentation for Namespaces folder

### Changed

- **Build Pipeline**: Updated build system to generate modern package supporting multiple formats and environments (ESM, CJS, UMD)
- **Plot Namespace**: Restructured Plot namespace for better organization and maintainability
- **Documentation**: Updated README with improved formatting and comprehensive project information

### Fixed

- **Critical TA bug** : Fixed a critical bug in atr, ema and stdev moving averages, the bug was affecting series that contain NaN values.
- **Equality Operator**: Fixed `__eq` method to properly handle string value comparisons
- **Transpiler Expression Handling**: Fixed wrong decomposition of expressions passed to JSON objects
- **TA Functions**: Fixed `ta.pivotlow` and `ta.pivothigh` when called without optional source argument
- **Matrix Build**: Fixed matrix namespace build issues

## [0.6.0] - 2025-12-15 - Array, Map, Matrix namespaces & API enhancements

### Added

- **Array namespace enhancements**:
    - Implementation of array strong typing
    - Array binary search functions
    - Additional array methods: `sum`, `avg`, `min`, `max`, `median`, `mode`, `stdev`, `variance`, `covariance`, `standardize`, `range`, `abs`, `percentrank`, `percentile_linear_interpolation`, `percentile_nearest_rank`
- **Map namespace**: Full support for `map` namespace operations
- **Matrix namespace**: Full support for `matrix` namespace operations
- **Timeframe namespace**: Complete implementation of timeframe-related functions
- **Request namespace**: Added `request.security_lower_tf` function
- **Syminfo namespace**: Fully implemented in Binance provider
- Better API coverage tracking with badges
- Progress on `math` methods implementations

### Changed

- Updated `input.*` namespace to fully support dynamic Pine Script parameters

### Fixed

- Map and Matrix initialization issues
- Array precision handling
- Array methods fixes to match exact PineScript logic: `slice`, `every`, `median`, `mode`, `percentile_nearest_rank`, `percentrank`, `some`, `sort_indices`, `sort`
- Array method fixes: `fill`, `new_float`, `push`, `set`, `unshift`
- Transpiler return statement for native data
- Binance provider cache handling
- Transpiler: passing native series to JSON objects

## [0.5.0] - 2025-12-04 - Extensive TA implementation & Transpiler enhancements

### Added

- Comprehensive implementation of `ta` namespace methods:
    - **Trend**: `supertrend`, `dmi`, `sar`, `falling`, `rising`, `cross`
    - **Volatility/Range**: `bb` (Bollinger Bands), `bbw`, `kc` (Keltner Channels), `kcw`, `range`, `tr` (True Range as method)
    - **Volume**: `accdist`, `cum`, `iii`, `nvi`, `pvi`, `pvt`, `wad`, `wvad`
    - **Oscillators**: `cci`, `cmo`, `cog`, `mfi`, `stoch`, `tsi`, `wpr`
    - **Statistical/Rank**: `correlation`, `barssince`, `valuewhen`, `percentrank`, `percentile_linear_interpolation`, `percentile_nearest_rank`, `mode`, `highestbars`, `lowestbars`
- Core `bar_index` variable support

### Changed

- **Unified Namespace Architecture**: All namespace members (e.g., `ta.tr`, `ta.obv`) are now implemented as methods. The transpiler automatically handles the conversion from property access to method call (e.g., `ta.tr` → `ta.tr()`)
- Updated `ta.tr` and `ta.obv` to align with the unified method pattern

### Fixed

- **`var` keyword semantics**: Implemented correct Pine Script behavior for `var` variables (initialize once, persist state across bars) via `$.initVar`
- `math.sum` handling of `NaN` values
- Transpiler handling of tertiary conditions involving Series access
- `ta.supertrend` calculation logic

## [0.4.0] - TBD - Request.security implementation and transpiler enhancements

### Added

- Full implementation of `request.security()` function with lookahead and gaps support
- New TA methods: `obv`, `alma`, `macd`, `swma`, `vwap`
- Architecture documentation for transpiler, runtime, and namespaces
- Support for handling raw .pine.ts indicator code (without context function wrapper)
- Ability to show original code lines in transpiled code as comments for debugging
- Comprehensive unit tests for `request.security()` functionality
- harmonization of Series logic accross the codebase

### Changed

- Restructured TA unit tests for better organization
- Improved Series handling for better performance and reliability
- Enhanced transpiler to handle implicit pine.ts imports and normalize native imports
- Namespaces import harmonization across the codebase

### Fixed

- Critical recursion bug in `request.security()` implementation
- Tuple return handling in functions
- Property type check issues

## [0.3.1] - 2025-11-26 - Code coverage

### Added

- Automatic code coverage badge generation

## [0.3.0] - 2025-11-26 - Major refactor + optimization

### Added

- Pagination and streaming mode support for processing large datasets
- Automatic regression tests generator for Pine Script compatibility testing
- Series class implementation for forward arrays optimization
- Support for checking transpiled code during development
- Added Pine Script language unit tests
- Added WillVixFix and SQZMOM indicators for compatibility tests
- Automatic code coverage badge

### Changed

- Major namespaces refactoring for better organization and maintainability
- Transpiler refactor for improved code generation
- Updated unit tests with new approach to compare to Pine Script data
- Updated documentation pages and build process
- Improved README readability and documentation links

### Fixed

- Fixed compound assignment operations
- Fixed history access in series
- Fixed index handling in forward arrays
- Fixed plot parameters
- Fixed arithmetic operations for native series
- Fixed browser build
- Fixed plot values and time indexes

## [0.2.1] - 2025-11-16 - Hotfix: floating point equality + performance optimization

### Fixed

- Missing math namespace for floating point equality check
- Small performance optimization (removed array slicing in the main loop)

### Changed

- Updated README and transpiler unit tests (added cache id)
- Documentation indicators update

## [0.2.0] - 2025-11-15 - Major TA performance optimization

### Changed

- Performance optimization: reimplementation of most TA functions to enhance performance (~x5 execution speed on average)
- Documentation updates

## [0.1.34] - 2025-04-24 - Documentation and bug fixes

### Fixed

- Fix issue #4 (https://github.com/alaa-eddine/PineTS/issues/4)
- Fix doc page chart

### Changed

- Documentation updates
- Added demo chart to the documentation
- Theme update: switching to just-the-docs theme
- GitHub pages layout updates
- Documentation layout fixes

## [0.1.33] - 2025-04-24 - Functions variables bug fix

### Fixed

- Functions variables bug fix

## [0.1.32] - 2025-04-23 - TA crossover functions

### Added

- Support for ta.crossover, ta.crossunder, ta.pivothigh, ta.pivotlow functions

## [0.1.31] - 2025-02-12 -

### Added

- Fix for math.avg function

## [0.1.3] - 2025-02-10 -

### Added

- Multiple transpiler fixes
- Fix Logical, Binary and unary expressions when passed as arguments to PineTS internal functions (e.g plot(close && open, ...))
- Support fo "na" as valid value (will be converted to NaN by the transpiler)
- Fix for Pine Script functions returning tupples
- Add partial support for color.rgb and color.new (these need to be completely rewritten)
- Experimenting a cache approach for TA functions (not yet ready, only tested with sma)
- Add Support for querying large time interval from MarketDataProvider by running multiple requests with a step, the requested market data is cached to prevent rate limiting and optimize performance
- Complete refactor of math.\* functions to ensure compatibility with time series for all functions using the same syntax as Pine Script

## [0.1.2] - 2025-02-05 - initial request.security() support

### Added

- Support for request.security() function : in this build we only support the security() function for timeframes higher than the current timeframe, also, gaps, ignore_invalid_symbol, currency and calc_bars_count parameters are supported yet

## [0.1.1] - 2025-02-01 - array namespace

### Added

- array namespace partial support. Ported functions : array.new_bool, array.new_float, array.new_int, array.new_string, array.new<type>, abs, avg, clear, concat, copy, covariance, every, fill, first, from, get, includes, indexof, insert, join, last, lastindexof, pop, push, range, remove, reverse, set, shift, slice, some, sort, sort_indices, standardize, stdev, sum.
- Documentation pages to track portage coverage of Pine Script API and Language features.

## [0.1.0] - 2025-01-29 - Initial release

This is the first release of PineTS, a TypeScript library that allows you to port Pine Script indicators to TypeScript.

### Added

- Support for Pine Script time series, if conditions, for loops, functions, and partial plot directives.
- Partial implementation of ta namespace. ported functions : ema, sma, vwma, wma, hma, rma, change, rsi, atr, mom, roc, dev, variance, highest, lowest, median, stdev, linreg, supertrend.
- Partial implementation of math namespace. ported functions : abs, pow, sqrt, log, ln, exp, floor, round, random, max, min, sin, cos, tan, asin, acos, atan, avg.
