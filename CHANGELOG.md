# Change Log

## [0.9.0] - 2026-02-27 - Box, Table & Polyline Namespaces, Pine Script Compliance & Critical Fixes

### Added

- **Box Namespace (`box.*`)**: Full implementation of the box drawing namespace — `box.new()`, `box.copy()`, `box.delete()`, and all setter/getter methods (`set_left`, `set_right`, `set_top`, `set_bottom`, `set_bgcolor`, `set_border_color`, `set_border_width`, `set_border_style`, `set_text`, `set_text_color`, `set_text_size`, `set_extend`, etc.).
- **Table Namespace (`table.*`)**: Full implementation of the table drawing namespace — `table.new()`, `table.cell()`, `table.delete()`, and cell/table setter methods. Tables are positioned at fixed screen locations (`position.top_left`, `position.bottom_center`, etc.) and rendered as DOM overlays in QFChart.
- **Polyline Namespace (`polyline.*`)**: Implementation of `polyline.new()` for rendering multi-point connected paths from arrays of `chart.point` objects, with support for curved lines, closed shapes, and fill color.
- **Primitive Type Declarations**: Added support for `int()`, `float()`, and `string()` cast/conversion expressions in Pine Script syntax (e.g., `x = int(someValue)`).
- **`enum` Keyword Support**: Added `enum` keyword handling in the transpiler for Pine Script v6 enum declarations.
- **Test Coverage**: Comprehensive new test suites — `box.test.ts`, `table.test.ts`, `polyline.test.ts`, `linefill.test.ts`, `fill.test.ts`, `hline.test.ts`, `line.test.ts`, `plot.test.ts`, `constants.test.ts`, `request.test.ts`, `ta-backfill.test.ts`, `parser-fixes.test.ts` (1000+ new test cases).

### Changed

- **Type Name Compliance**: Renamed internal type constant names to match Pine Script's naming convention exactly (e.g., `label.style_label_up` → `label.style_label_up`). Aligned string constants across label styles, line styles, shape types, and size presets so PineTS output is directly compatible with QFChart renderers without manual mapping.

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
