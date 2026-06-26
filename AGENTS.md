# PineTS - AI Agent Instructions

## Project Overview

**PineTS** is a JavaScript/TypeScript library that enables the execution of Pine Script indicators in a JavaScript environment. It consists of two main components:

1. **Pine Script Transpiler**: Converts native Pine Script v5+ code to PineTS syntax
2. **PineTS Runtime Transpiler**: Transforms PineTS syntax into executable JavaScript with proper time-series semantics

### Key Characteristics

-   **Dual Input Support**: Accepts both native Pine Script v5+ and PineTS syntax
-   **Runtime Transpilation**: Transforms code at runtime without requiring pre-compilation
-   **Pine Script v5+ Compatibility**: Full syntax support for TradingView's Pine Script
-   **Time-Series Processing**: Handles historical data with proper lookback capabilities
-   **Stateful Calculations**: Supports incremental technical analysis calculations
-   **Series-Based Architecture**: Everything is a time-series with forward storage and reverse access

## Golden Rule: Verify, Don't Assume

PineTS exists to reproduce TradingView's Pine Script behavior **exactly**. A change that *looks* correct but was never executed is not a contribution — it's a guess. Treat every statement about behavior as unverified until you have run it and seen the output.

-   **Never assume a function is correct** because the code reads well. Run it and inspect the actual values.
-   **Never assume your change fixed the bug.** Reproduce the bug first, then prove the fix against that reproduction.
-   **Never assume your change broke nothing.** Run the full suite (`npm test -- --run`) before calling the work done.
-   **The reference for "correct" is TradingView.** When unsure what a Pine function *should* return, run the same script on TradingView and compare. Expected values in tests must come from an independent source of truth — never from "whatever PineTS currently prints."

Everything below — especially **[Testing Discipline](#testing-discipline)** and **[How to Fix a Reported Bug](#how-to-fix-a-reported-bug)** — exists to support this rule.

## Architecture Documentation

Before making changes, familiarize yourself with the architecture:

-   **[Architecture Guide](docs/architecture/index.md)**: Main architecture overview
-   **[Transpiler](docs/architecture/transpiler/index.md)**: AST parsing, scope analysis, code transformation
    -   [Scope Manager](docs/architecture/transpiler/scope-manager.md): Variable renaming and unique ID generation
    -   [Transformers](docs/architecture/transpiler/transformers.md): AST transformation logic
    -   [Real Examples](docs/architecture/transpiler/examples.md): Actual transpilation output
-   **[Runtime](docs/architecture/runtime/index.md)**: Context, Series, and execution loop
    -   [Context Class](docs/architecture/runtime/context.md): The global state object
    -   [Series Class](docs/architecture/runtime/series.md): Forward storage with reverse access
    -   [Execution Flow](docs/architecture/runtime/execution-flow.md): Run loop and pagination
-   **[Namespaces](docs/architecture/namespaces/index.md)**: Implementation of `ta`, `math`, `request`, etc.
    -   [Technical Analysis (ta)](docs/architecture/namespaces/ta.md)
    -   [Math (math)](docs/architecture/namespaces/math.md)
    -   [Array (array)](docs/architecture/namespaces/array.md)
    -   [Request (request)](docs/architecture/namespaces/request.md)
    -   [Input (input)](docs/architecture/namespaces/input.md)
-   **[Debugging Guide](docs/architecture/debugging.md)**: Practical debugging techniques
-   **[Best Practices](docs/architecture/best-practices.md)**: Common pitfalls and recommended patterns

## Critical Concepts

### 1. Input Types: Pine Script vs PineTS Syntax

**CRITICAL**: PineTS accepts TWO different input formats. Understanding the difference is essential.

#### Detection Logic

```
Input Source
    │
    ├─ Is Function? ──────────────────→ Convert to string, treat as PineTS
    │
    └─ Is String?
           │
           ├─ Has //@version=X marker?
           │       │
           │       ├─ X >= 5 ──────────→ Pine Script → pineToJS pipeline
           │       └─ X < 5 ───────────→ Error (unsupported)
           │
           └─ No version marker ───────→ PineTS syntax (use as-is)
```

#### Pine Script v5+ (Native TradingView Syntax)

Detected by the `//@version=5` (or higher) marker. Goes through the `pineToJS` pipeline first.

```pinescript
//@version=5
indicator("EMA Cross")
fast = ta.ema(close, 9)
slow = ta.ema(close, 21)
plot(fast, "Fast EMA")
plot(slow, "Slow EMA")
```

#### PineTS Syntax (JavaScript-like)

No version marker. Uses JavaScript syntax with the `$` context object.

```javascript
($) => {
    const { close } = $.data;
    const { ta, plot } = $.pine;

    const fast = ta.ema(close, 9);
    const slow = ta.ema(close, 21);
    plot(fast, 'Fast EMA');
    plot(slow, 'Slow EMA');

    return { fast, slow };
};
```

> **Runtime accessor note**: `$.data` (OHLCV series) and `$.pine` (namespaces: `ta`, `math`, `plot`, …) are the **current** API. Some older test fixtures use the bare `context.ta` / `context.core` accessors — those are **deprecated** (they emit a runtime deprecation warning). Always write new code against `$.data` / `$.pine`.

#### JavaScript Function (Direct)

Functions are converted to string and treated as PineTS syntax.

```javascript
pineTS.run(($) => {
    const { close } = $.data;
    const { ta } = $.pine;
    return ta.sma(close, 20);
});
```

### 2. Transpiler Pipeline

The transpiler operates in two stages depending on input type:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        STAGE 1: Pine Script → PineTS                    │
│                    (Only for Pine Script input)                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Pine Script Input          pineToJS Pipeline           PineTS Output   │
│  ──────────────────    ─────────────────────────    ─────────────────   │
│  //@version=5          │ Lexer (tokenize)       │                       │
│  indicator("Test")     │ Parser (build AST)     │    ($) => {           │
│  sma = ta.sma(close,20)│ CodeGen (emit JS)      │      const {close}... │
│  plot(sma)             └─────────────────────────┘      ...             │
│                                                       }                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     STAGE 2: PineTS → Executable JS                     │
│                    (Both input types converge here)                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. Wrap in async context function                                      │
│  2. Parse to JavaScript AST (Acorn)                                     │
│  3. Pre-processing passes:                                              │
│     - Transform nested arrow functions to declarations                  │
│     - Normalize native imports (preserve Math, Array, etc.)             │
│     - Inject implicit imports (close, ta, etc. from context)            │
│     - Pre-process context-bound variables                               │
│  4. Analysis pass (ScopeManager):                                       │
│     - Build scope hierarchy                                             │
│     - Rename variables: x → glb1_x, if2_y, fn1_z (per-type counters)    │
│     - Generate TA call IDs: _ta0, _ta1, _ta2...                         │
│     - Track variable kinds (const/let/var)                              │
│  5. Transformation pass:                                                │
│     - let x = val    →  $.let.glb1_x = $.init($.let.glb1_x, val)        │
│     - x = val        →  $.set($.let.glb1_x, val)                        │
│     - close[1]       →  $.get(close, 1)                                 │
│     - ta.ema(c, 9)   →  ta.ema(p0, p1, '_ta0')  (with param wrapping)   │
│  6. Post-process comparisons:  ==/!=/</<=/>/>= →                        │
│        $.pine.math.__eq/__neq/__lt/__le/__gt/__ge                       │
│  7. Generate code (astring)                                            │
│  8. Create executable function                                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3. Forward Storage, Reverse Access

**CRITICAL**: PineTS stores arrays in forward chronological order (oldest→newest) but provides Pine Script's reverse indexing semantics (0=current, 1=previous).

**How it works:**

-   **Internal Storage**: JavaScript arrays store data forward: `[oldest, ..., newest]`
-   **Pine Script Syntax**: User writes `close[0]` (current) and `close[1]` (previous)
-   **Transpiler's Job**: Converts `close[0]` → `$.get(close, 0)` which translates to `close[length-1]`
-   **Series Class**: Wraps arrays to provide this reverse indexing automatically

**Why forward storage?**

-   **Performance**: Using `.push()` to append new bars is O(1), while `.unshift()` to prepend would be O(n)
-   **Natural order**: Matches chronological order of market data from APIs
-   **Memory efficiency**: No need to shift all elements when adding new data

```javascript
// Internal storage (what you see in memory)
close = [100, 101, 102, 103, 104]  // Forward: oldest to newest
         ↑                      ↑
      oldest                 newest

// Pine Script access (what user writes)
close[0]  // Returns 104 (current/newest)
close[1]  // Returns 103 (previous)
close[4]  // Returns 100 (oldest)

// In TA functions, use Series.from():
const current = Series.from(source).get(0);   // Current bar
const previous = Series.from(source).get(1);  // Previous bar
```

### 4. Series Class

The `Series` class wraps arrays to provide Pine Script indexing. Always use `Series.from()` in TA functions:

```typescript
const currentValue = Series.from(source).get(0); // Current bar
const previousValue = Series.from(source).get(1); // Previous bar
```

`get(index)` reverse-indexes internally (`data[data.length - 1 - (offset + index)]`) and returns `NaN` when the index is out of bounds.

### 5. Incremental Calculation

TA functions MUST use incremental calculation with state, not recalculation:

```typescript
// ✅ CORRECT: O(1) per bar
export function sma(context: any) {
    return (source: any, period: any, _callId?: string) => {
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `sma_${period}`;
        if (!context.taState[stateKey]) {
            context.taState[stateKey] = { window: [], sum: 0 };
        }
        const state = context.taState[stateKey];
        // Update state incrementally...
    };
}
```

> Real implementations (see `src/namespaces/ta/methods/ema.ts`, `sma.ts`) keep a richer committed/tentative state object keyed by `context.idx` so live (still-forming) bars don't corrupt history. The minimal `{ window, sum }` above is illustrative of the *mechanism*, not a literal template.

### 6. Unique Call IDs

Always use `_callId` parameter to isolate state between multiple calls:

```typescript
export function myIndicator(context: any) {
    return (source: any, period: any, _callId?: string) => {
        const stateKey = _callId || `myInd_${period}`; // REQUIRED
        // ...
    };
}
```

The transpiler automatically generates unique call IDs (`_ta0`, `_ta1`, etc.) for each TA function call to ensure state isolation.

### 7. Tuple Returns

Functions returning tuples MUST use the double-bracket convention (the runtime's `init`/`initVar` detect `Array.isArray(src[0])` to unwrap the outer bracket):

```typescript
// ✅ CORRECT
return [[value1, value2, value3]];

// ❌ WRONG
return [value1, value2, value3];
```

### 8. Precision

Always use `context.precision()` for numeric outputs. It rounds to 10 decimals by default (`Math.round(value * 1e10) / 1e10`), matching TradingView's float behavior:

```typescript
return context.precision(result);
```

## Development Workflow

### Build System

The browser/Node test runner uses TypeScript source directly (via `vite-tsconfig-paths`), so unit tests do **not** require a build. You only need a build when testing through a bundled artifact (e.g. browser dist):

```bash
npm run build:dev:all     # All dev bundles (CJS, ES, Browser, Browser-ES)
npm run build:prod:all    # All prod bundles (minified)
```

`build:*:all` first runs every `generate:*-index` script to regenerate namespace barrel files. If you edit a built bundle's behavior, **rebuild before testing the bundle** — a stale bundle is a classic source of "my fix isn't working."

### Running Tests

**IMPORTANT**: PineTS uses **Vitest**, not Jest. Use the correct flags:

```bash
# ✅ CORRECT: Run all tests once (non-interactive)
npm test -- --run

# ✅ CORRECT: Run tests whose path matches a substring
npm test -- ta-stress.test.ts --run

# ✅ CORRECT: Run with coverage
npm run test:coverage

# ✅ Watch mode (during local development)
npm test

# ❌ WRONG: These are Jest flags, not Vitest
npm test -- --no-watch        # Won't work
npm test -- --watchAll=false  # Won't work
```

(`npm test` runs `vitest --reporter verbose`, which defaults to watch mode in a TTY; `--run` forces a single non-interactive run.)

### Adding New TA Functions

1. Create implementation in `src/namespaces/ta/methods/yourfunction.ts`
2. Follow the factory pattern with `_callId` parameter (`export function yourfunction(context) { return (source, period, _callId?) => { ... } }`)
3. Use incremental calculation with `context.taState`
4. Return `NaN` during the initialization period (insufficient data)
5. Use `context.precision()` for output
6. **Write a real test** for it — see **[Testing Discipline](#testing-discipline)**. A `.pine.ts` fixture alone is *not* a test.
7. **Regenerate the barrel file**: `npm run generate:ta-index` (other namespaces: `generate:math-index`, `generate:array-index`, `generate:input-index`, `generate:request-index`, `generate:map-index`, `generate:matrix-index`)

### File Structure

The tree below shows the important locations. It is intentionally **not** exhaustive — `namespaces/` has one folder (or file) per Pine namespace, and `methods/` folders hold one file per built-in.

```
src/
├── index.ts                  # Main entry point
├── PineTS.class.ts           # Main execution engine (run loop, pagination)
├── Context.class.ts          # Runtime context ($.data, $.pine, $.let/$.var, taState, idx, precision)
├── Series.ts                 # Series wrapper (forward storage, reverse indexing)
├── Indicator.ts              # Indicator wrapper (runtime input/prop overrides)
├── Indicator/                # Indicator internals (input/prop proxies, declaration scanning)
├── transpiler/
│   ├── index.ts              # transpile() entry point
│   ├── settings.ts           # NAMESPACES_LIKE, FACTORY_METHODS, known namespaces
│   ├── pineToJS/             # Pine Script → PineTS (lexer, parser, codegen, ast, tokens)
│   ├── analysis/             # ScopeManager.ts, AnalysisPass.ts
│   ├── transformers/         # Main / Expression / Statement / Wrapper / Injection / Normalization
│   ├── slicing/              # buildLtfSlices.ts (lower-timeframe request.security slicing)
│   └── utils/                # ASTFactory.ts
├── namespaces/               # Pine Script built-ins — one folder/file per namespace
│   ├── Core.ts Barstate.ts Log.ts Str.ts Time.ts Timeframe.ts Ticker.ts Types.ts Plots.ts utils.ts
│   ├── ta/ math/ array/ map/ matrix/ input/ request/   # each: <ns>.index.ts (barrel) + methods/
│   └── line/ label/ box/ table/ linefill/ polyline/ color/ chart/ strategy/   # drawing / color / strategy
├── marketData/               # Data providers
│   ├── IProvider.ts BaseProvider.ts Provider.class.ts aggregation.ts
│   └── Binance/ Mock/ Alpaca/ FMP/
├── core/  errors/  utils/  types/   # shared runtime helpers, error types, utilities, type defs
└── ...                        # (chart/, editor/, pinescript/, ui/, assets/ — peripheral)

tests/                         # Vitest collects ONLY tests/**/*.test.ts (see vitest.config.ts)
├── core/           # Core runtime tests
├── namespaces/     # Per-namespace tests (ta, math, array, map, matrix, plot, fill, line, label, box, strategy, ...)
├── indicators/     # Real-world indicator accuracy tests
├── transpiler/     # Transpiler transformation tests
├── compatibility/  # Generated regression suite (.pine.ts fixtures + .expect.json + namespace runners)
├── marketData/     # Provider / aggregation tests
├── Indicator/      # Indicator-wrapper tests
├── automated/      # Generated test suites
└── _local/         # Local dev tests (gitignored, excluded from coverage)

docs/
├── architecture/   # transpiler/, runtime/, namespaces/, specifics/, best-practices.md, debugging.md
├── api-coverage/   # Pine Script API coverage tracking
└── *.md            # Published guide pages (getting-started, strategy, alerts, pagination, ...)
```

## Testing Discipline

PineTS reproduces a third-party platform, so **every behavior must be backed by an executable test**. This is not bureaucracy — it is the only way to know your code does what you think it does (see [Golden Rule](#golden-rule-verify-dont-assume)).

### How the suite is organized

-   **`*.test.ts`** — the **only** files Vitest runs (`vitest.config.ts` → `include: ['tests/**/*.test.ts']`). A test uses `describe`/`it`, builds a `PineTS` instance, runs a script, and asserts on the result.
-   **`*.pine.ts`** — **not tests.** They are bare Pine-body fixtures (`(context) => { ...; return {...}; }`) with no `describe`/`it`/`import`. Vitest never executes them directly; they feed the compatibility regression generator. **Adding a `.pine.ts` file alone adds nothing runnable.**
-   **`tests/compatibility/`** — a regression-snapshot suite. Each namespace has a runner (e.g. `tests/compatibility/namespace/ta/methods/ta.test.ts`) with one `it()` per indicator that compares live output against a committed `data/<name>.expect.json` snapshot.

> The compatibility snapshots capture *current* PineTS output, so they guard against **regressions** but do not by themselves prove **correctness**. For new functionality and bug fixes, the expected values must come from an independent reference (TradingView, a hand calculation), not from a snapshot of possibly-wrong output.

### Writing a test

Standard pattern — deterministic `Mock` provider, assert on `plots`/`result`:

```typescript
import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';        // or: import { PineTS } from 'index';
import { Provider } from '@pinets/marketData/Provider.class';

describe('ta.myfunc', () => {
    it('matches the expected series', async () => {
        const pineTS = new PineTS(
            Provider.Mock,
            'BTCUSDC',
            '60',
            null,
            new Date('2024-01-01').getTime(),
            new Date('2024-01-10').getTime()
        );

        const { plots, result } = await pineTS.run(($) => {
            const { close } = $.data;
            const { ta, plotchar } = $.pine;

            const r = ta.myfunc(close, 14);
            plotchar(r, 'r');
            return { r };
        });

        const data = plots['r'].data;
        expect(data.length).toBeGreaterThan(0);

        // EXPECTED comes from an INDEPENDENT reference (e.g. TradingView), never from PineTS itself.
        expect(data[data.length - 1].value).toBeCloseTo(EXPECTED, 8);
    });
});
```

-   Use `$.data` / `$.pine` (the bare `context.ta` / `context.core` style is deprecated).
-   `Provider.Mock` generates deterministic synthetic OHLCV (no network, no fixtures) — ideal for reproducible tests.
-   Expected values come from a **source of truth**, not from copying current output, or the test only certifies "the bug is still here."

### Every test should cover

1.  **Basic functionality**: correct calculation with known inputs
2.  **Edge cases**: NaN inputs, single bar, empty/insufficient data
3.  **Multiple calls**: same parameters and different parameters
4.  **Initialization period**: returns `NaN` until there is enough data
5.  **State isolation**: independent state across different call sites / `_callId`s

## How to Fix a Reported Bug

When a user reports an issue, **do not jump straight to a fix.** Follow this loop — it proves the bug is real, proves the fix works, and makes sure the bug can never silently return:

1.  **Reproduce it first.** Write the smallest Pine/PineTS script that triggers the reported behavior and run it. If you cannot reproduce it, you do not yet understand it — get more detail (script, symbol, timeframe, expected vs actual) before touching code. Confirm the output is actually wrong by comparing against TradingView or the user's expected value.
2.  **Capture it as a *failing* test.** Turn the reproduction into a `*.test.ts` that asserts the **correct** (expected) value, and run it — it must **fail** for the right reason. A bug you can't express as a failing test is a bug you can't prove you fixed. The expected value comes from the reference, not from current PineTS output.
3.  **Implement the fix** in `src/`.
4.  **Re-run that test — it must now pass.** If it doesn't, the fix is wrong or incomplete; iterate. (If you're testing a built bundle, rebuild first.)
5.  **Run the full suite** (`npm test -- --run`) to confirm you didn't break anything else.
6.  **Keep the test.** It is now a permanent **regression guard**: any future change that reintroduces the bug fails immediately. Commit it alongside the fix.

This **reproduce → fail → fix → pass → guard** loop is the expected workflow for every bug fix, no exceptions.

## Common Mistakes to Avoid

### ❌ Mistake 1: Direct Array Access

```javascript
// WRONG
const current = close[close.length - 1];
```

**Fix**: Use `$.get(close, 0)` or `Series.from(close).get(0)`

### ❌ Mistake 2: Missing \_callId

```javascript
// WRONG
export function ema(context: any) {
    return (source: any, period: any) => {
        const stateKey = `ema_${period}`; // Shared state!
    };
}
```

**Fix**: Add `_callId?: string` parameter and use it in state key

### ❌ Mistake 3: Recalculating History

```javascript
// WRONG: O(n) per bar
for (let i = 0; i < period; i++) {
    sum += Series.from(source).get(i);
}
```

**Fix**: Use incremental state with rolling window

### ❌ Mistake 4: Not Handling NaN

```javascript
// WRONG
state.sum += currentValue; // NaN corrupts state!
```

**Fix**: Check `isNaN(currentValue)` before updating state

### ❌ Mistake 5: Forgetting Precision

```javascript
// WRONG
return sum / period;
```

**Fix**: `return context.precision(sum / period);`

### ❌ Mistake 6: Plain Tuple Return

```javascript
// WRONG
return [macd, signal, hist];
```

**Fix**: `return [[macd, signal, hist]];`

### ❌ Mistake 7: Confusing Pine Script with PineTS Syntax

```javascript
// WRONG: Mixing syntaxes
pineTS.run(`
//@version=5
($) => {  // Can't have both!
    ...
}
`);
```

**Fix**: Use either Pine Script (with `//@version=5`) OR PineTS syntax (with `($) => {}`), never both.

## Transpiler Rules

### DO NOT modify the transpiler unless absolutely necessary

-   The transpiler is complex and fragile
-   Always run the full test suite after transpiler changes
-   Understand scope management before making changes
-   Consult [Transpiler Documentation](docs/architecture/transpiler/index.md)

### Variable Transformation

| Original Pattern       | Transformed Pattern                            | Purpose                |
| ---------------------- | ---------------------------------------------- | ---------------------- |
| `let x = value`        | `$.let.glb1_x = $.init($.let.glb1_x, value)`   | State persistence      |
| `const x = value`      | `$.const.glb1_x = $.init($.const.glb1_x, val)` | Constant series        |
| `var x = value`        | `$.var.glb1_x = $.initVar($.var.glb1_x, val)`  | Persistent state       |
| `x = value`            | `$.set($.let.glb1_x, value)`                   | Update current value   |
| `x[1]`                 | `$.get(x, 1)`                                  | Pine Script indexing   |
| `ta.func(a, b)`        | `ta.func(p0, p1, '_ta0')` (each arg wrapped)   | State isolation        |
| `a == b`               | `$.pine.math.__eq(a, b)`                       | NaN-safe comparison    |
| `const [a, b] = f()`   | Split into individual inits                    | Tuple destructuring    |

Notes:

-   The storage namespace (`$.let` / `$.var` / `$.const`) matches the variable's actual declaration kind; `$.let` above is illustrative.
-   **TA calls wrap each argument** into its own hoisted temp via `ta.param(...)`, then append the generated call-id literal: `ta.ema(close, 9)` → `const p0 = ta.param(close, …); const p1 = ta.param(9, …); ta.ema(p0, p1, '_ta0')`.
-   **All comparisons** are rewritten to na-aware helpers with a `1e-10` tolerance: `==`/`===` → `__eq`, `!=`/`!==` → `__neq`, `<` → `__lt`, `<=` → `__le`, `>` → `__gt`, `>=` → `__ge`. Relational operators inside `for`/`while` loop headers and the generated loop guard are left as native JS (their operands are integer counters that are never `na`).

### Scope Prefixes

Variables are renamed by scope. **Each scope *type* keeps its own counter**, so the number is how many scopes of that type have been opened so far during transpilation (order-dependent) — it is **not** a single global `1, 2, 3, 4` sequence across types. The counter for a type can also advance by more than one when nested block scopes are pushed.

| Scope Type    | Prefix pattern | Example (first of its type) |
| ------------- | -------------- | --------------------------- |
| Global        | `glb<n>_`      | `glb1_x`                    |
| Function      | `fn<n>_`       | `fn1_x`                     |
| For loop      | `for<n>_`      | `for1_i`                    |
| While loop    | `whl<n>_`      | `whl1_n`                    |
| If block      | `if<n>_`       | `if2_y` (count may skip)    |
| Else block    | `els<n>_`      | `els1_z`                    |

To see the real prefixes a script produces, transpile it and inspect the generated code (see [View Transpiled Code](#view-transpiled-code)).

## Code Style

### TypeScript

-   Use TypeScript for new code
-   Type function signatures properly
-   Document complex logic with comments

### Naming Conventions

-   TA functions: lowercase (e.g., `ema`, `sma`, `rsi`)
-   Classes: PascalCase (e.g., `Series`, `Context`)
-   Private methods: prefix with `_` (e.g., `_initializeState`)
-   State keys: use `_callId` or a descriptive string

### Comments

-   Explain WHY, not WHAT
-   Document non-obvious behavior
-   Add warnings for critical sections

## Git Workflow

### Commits

-   Write clear, descriptive commit messages
-   Reference issue numbers when applicable
-   Keep commits focused and atomic
-   Commit the regression test alongside the fix it guards

### Branches

-   Feature branches: `feature/description`
-   Bug fixes: `fix/description`
-   Optimizations: `optimization/description`

### Pull Requests

-   Include test coverage for every change
-   Update documentation if you changed public APIs
-   Regenerate barrel files if adding namespace methods
-   Ensure all tests pass: `npm test -- --run`

## Performance Considerations

1.  **Incremental Calculation**: O(1) per bar, not O(n)
2.  **State Management**: Store only necessary data
3.  **Series Wrapping**: Reuse Series objects when possible
4.  **Avoid Redundant Calculations**: Cache expensive operations

## Debugging

### Enable Debug Output

```javascript
// In a TA function
console.log(`[${_callId}] Current value:`, currentValue);
console.log(`[${_callId}] State:`, state);
```

### View Transpiled Code

`transpile(source, { debug: true })` returns the executable function and, with `debug: true`, **annotates the generated code with inline source-line comments** (`// [Line N] ...`). It does **not** print anything itself — inspect the returned function to read the generated JS:

```javascript
import { transpile } from './src/transpiler';

const userCode = ($) => {
    const { close } = $.data;
    const { ta } = $.pine;
    return ta.sma(close, 20);
};

const transpiledFn = transpile(userCode, { debug: true });
console.log(transpiledFn.toString()); // <- prints the generated JS (with debug comments)
```

### Check Context State

```javascript
console.log('Variables:', context.let);
console.log('TA State:', context.taState);
console.log('Current Index:', context.idx);
```

See the [Debugging Guide](docs/architecture/debugging.md) for more techniques.

## Resources

-   **Architecture**: [docs/architecture/](docs/architecture/)
-   **API Coverage**: [docs/api-coverage/](docs/api-coverage/)
-   **Examples**: [docs/architecture/transpiler/examples.md](docs/architecture/transpiler/examples.md)
-   **Best Practices**: [docs/architecture/best-practices.md](docs/architecture/best-practices.md)

## When in Doubt

1.  Reproduce and run it — don't reason about behavior, observe it ([Golden Rule](#golden-rule-verify-dont-assume))
2.  Read the [Architecture Guide](docs/architecture/index.md) and [Best Practices](docs/architecture/best-practices.md)
3.  Look at existing implementations in `src/namespaces/ta/methods/`
4.  Run tests: `npm test -- --run`

## Summary

**Key Takeaways for AI Agents:**

-   ✅ **Verify, don't assume** — run it, observe the output, compare against TradingView
-   ✅ **Fix bugs via reproduce → failing test → fix → pass → keep as regression guard**
-   ✅ Only `*.test.ts` files run under Vitest; `*.pine.ts` are fixtures, not tests
-   ✅ Expected values come from an independent reference, never from current output
-   ✅ Understand the two input types: Pine Script (with `//@version=5`) vs PineTS syntax
-   ✅ Forward storage, reverse access (use `$.get()` or `Series.from()`)
-   ✅ Incremental calculation with state (not recalculation)
-   ✅ Always use `_callId` for state isolation; return tuples as `[[...]]`
-   ✅ Use `context.precision()` for numeric outputs; handle NaN inputs
-   ✅ Run tests with `npm test -- --run`; regenerate barrel files after adding methods
-   ❌ Don't modify the transpiler without deep understanding
-   ❌ Don't use direct array access for time-series data
-   ❌ Don't share state between function calls
-   ❌ Don't mix Pine Script and PineTS syntax in the same input
