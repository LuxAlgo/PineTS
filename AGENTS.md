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
│     - Rename variables: x → glb1_x, if2_y, fn3_z                        │
│     - Generate TA call IDs: _ta0, _ta1, _ta2...                         │
│     - Track variable kinds (const/let/var)                              │
│  5. Transformation pass:                                                │
│     - let x = val    →  $.let.glb1_x = $.init($.let.glb1_x, val)        │
│     - x = val        →  $.set($.let.glb1_x, val)                        │
│     - close[1]       →  $.get(close, 1)                                 │
│     - ta.ema(c, 9)   →  ta.ema(p0, p1, '_ta0')  (with param wrapping)   │
│  6. Post-process: a == b → $.pine.math.__eq(a, b)                       │
│  7. Generate code (astring)                                             │
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

### 5. Incremental Calculation

TA functions MUST use incremental calculation with state, not recalculation:

```typescript
// ✅ CORRECT: O(1) per bar
export function sma(context: any) {
    return (source: any, period: any, _callId?: string) => {
        const stateKey = _callId || `sma_${period}`;
        if (!context.taState[stateKey]) {
            context.taState[stateKey] = { window: [], sum: 0 };
        }
        const state = context.taState[stateKey];
        // Update state incrementally...
    };
}
```

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

Functions returning tuples MUST use double bracket convention:

```typescript
// ✅ CORRECT
return [[value1, value2, value3]];

// ❌ WRONG
return [value1, value2, value3];
```

### 8. Precision

Always use `context.precision()` for numeric outputs:

```typescript
return context.precision(result); // Rounds to 10 decimals
```

## Development Workflow

### Running Tests

**IMPORTANT**: PineTS uses **vitest**, not Jest. Use the correct flags:

```bash
# ✅ CORRECT: Run tests once (non-interactive)
npm test -- --run

# ✅ CORRECT: Run specific test file
npm test -- ta-stress.test.ts --run

# ✅ CORRECT: Run with coverage
npm run test:coverage

# ❌ WRONG: These are Jest flags, not vitest
npm test -- --no-watch        # Won't work
npm test -- --watchAll=false  # Won't work
```

### Adding New TA Functions

1. Create implementation in `src/namespaces/ta/methods/yourfunction.ts`
2. Follow the factory pattern with `_callId` parameter
3. Use incremental calculation with `context.taState`
4. Return `NaN` during initialization period
5. Use `context.precision()` for output
6. Add tests in `tests/compatibility/namespace/ta/methods/indicators/yourfunction.pine.ts`
7. **Regenerate barrel file**: `npm run generate:ta-index`

### File Structure

```
src/
├── index.ts                  # Main entry point
├── PineTS.class.ts           # Main execution engine
├── Context.class.ts          # Runtime context ($.data, $.pine, $.let, etc.)
├── Series.ts                 # Series wrapper for reverse indexing
├── Indicator.ts              # Indicator wrapper class (runtime inputs)
├── transpiler/
│   ├── index.ts              # Main transpiler entry point
│   ├── settings.ts           # Configuration and known namespaces
│   ├── pineToJS/             # Pine Script → PineTS converter
│   │   ├── pineToJS.index.ts # Pipeline entry point
│   │   ├── lexer.ts          # Tokenization with indentation tracking
│   │   ├── parser.ts         # AST generation from tokens
│   │   ├── codegen.ts        # JavaScript code generation
│   │   ├── ast.ts            # AST node type definitions
│   │   └── tokens.ts         # Token type definitions
│   ├── analysis/             # Code analysis
│   │   ├── ScopeManager.ts   # Variable scoping and renaming
│   │   └── AnalysisPass.ts   # Pre-processing analysis
│   ├── transformers/         # AST transformers
│   │   ├── MainTransformer.ts
│   │   ├── ExpressionTransformer.ts
│   │   ├── StatementTransformer.ts
│   │   ├── WrapperTransformer.ts
│   │   ├── InjectionTransformer.ts
│   │   └── NormalizationTransformer.ts
│   └── utils/
│       └── ASTFactory.ts     # AST node factory utilities
├── namespaces/               # Pine Script built-in functions
│   ├── Core.ts               # Core functions (na, nz, color, indicator)
│   ├── Barstate.ts           # Bar state information
│   ├── Log.ts                # Logging functions
│   ├── Str.ts                # String utilities
│   ├── Timeframe.ts          # Timeframe utilities
│   ├── Types.ts              # Type utilities and enums
│   ├── Plots.ts              # Plotting functions
│   ├── utils.ts              # Argument parsing utilities
│   ├── ta/                   # Technical Analysis
│   │   ├── ta.index.ts       # Auto-generated barrel file
│   │   └── methods/          # Individual TA functions
│   ├── math/                 # Mathematical operations
│   │   ├── math.index.ts     # Auto-generated barrel file
│   │   └── methods/
│   ├── array/                # Array operations
│   │   ├── array.index.ts    # Auto-generated barrel file
│   │   ├── PineArrayObject.ts
│   │   └── methods/
│   ├── map/                  # Map collection type
│   │   ├── map.index.ts      # Auto-generated barrel file
│   │   └── PineMapObject.ts
│   ├── matrix/               # Matrix collection type
│   │   ├── matrix.index.ts   # Auto-generated barrel file
│   │   └── PineMatrixObject.ts
│   ├── input/                # User inputs
│   │   ├── input.index.ts    # Auto-generated barrel file
│   │   └── methods/
│   └── request/              # Multi-timeframe (request.security)
│       ├── request.index.ts  # Auto-generated barrel file
│       └── methods/
├── marketData/               # Data providers
│   ├── IProvider.ts          # Provider interface
│   ├── Provider.class.ts     # Base provider and registry
│   ├── Binance/              # Binance exchange provider
│   └── Mock/                 # Mock provider for testing
└── types/
    └── PineTypes.ts          # Type definitions (plot options, etc.)

tests/
├── compatibility/            # Main test suite
│   ├── namespace/            # Namespace compatibility tests
│   │   ├── ta/methods/indicators/    # TA function tests
│   │   ├── math/methods/indicators/  # Math function tests
│   │   └── array/methods/indicators/ # Array function tests
│   └── misc/indicators/      # Miscellaneous indicator tests
├── namespaces/               # Additional namespace tests
│   └── ta/                   # TA-specific tests
├── indicators/               # Real-world indicator tests
├── transpiler/               # Transpiler tests
├── core/                     # Core functionality tests
└── _local/                   # Local development tests (gitignored)

docs/
├── architecture/             # Architecture documentation
│   ├── transpiler/
│   ├── runtime/
│   ├── namespaces/
│   └── specifics/            # Special topics (tuples, request.security)
└── api-coverage/             # Pine Script API coverage tracking
```

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

### DO NOT modify transpiler unless absolutely necessary

-   The transpiler is complex and fragile
-   Always run full test suite after transpiler changes
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
| `ta.func(arg)`         | `ta.func(p0, '_ta0')` with param wrapping      | State isolation        |
| `a == b`               | `$.pine.math.__eq(a, b)`                       | NaN-safe comparison    |
| `const [a, b] = f()`   | Split into individual inits                    | Tuple destructuring    |

### Scope Prefixes

Variables are renamed based on their scope:

| Scope Type   | Prefix Example | Description                    |
| ------------ | -------------- | ------------------------------ |
| Global       | `glb1_`        | Top-level scope                |
| If block     | `if2_`         | Inside if statements           |
| Function     | `fn3_`         | Inside function declarations   |
| For loop     | `for4_`        | Inside for loops               |

## Testing Requirements

### Unit Tests Must Include

1. **Basic functionality**: Correct calculation with known inputs
2. **Edge cases**: NaN inputs, single bar, empty data
3. **Multiple calls**: Same parameters, different call IDs
4. **Initialization period**: Return NaN when insufficient data
5. **State isolation**: Independent state for different calls

### Test Pattern

```typescript
import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

describe('My TA Function', () => {
    it('should calculate correctly', async () => {
        const pineTS = new PineTS(
            Provider.Mock,
            'BTCUSDC',
            '60',
            null,
            new Date('2024-01-01').getTime(),
            new Date('2024-01-10').getTime()
        );

        const { plots } = await pineTS.run(($) => {
            const { close } = $.data;
            const { ta, plotchar } = $.pine;

            const result = ta.myFunc(close, 14);
            plotchar(result, 'result');
        });

        expect(plots['result']).toBeDefined();
        expect(plots['result'].data.length).toBeGreaterThan(0);

        // Check specific values
        const lastValue = plots['result'].data[plots['result'].data.length - 1].value;
        expect(lastValue).toBeCloseTo(expectedValue, 8);
    });
});
```

## Code Style

### TypeScript

-   Use TypeScript for new code
-   Type function signatures properly
-   Document complex logic with comments

### Naming Conventions

-   TA functions: lowercase (e.g., `ema`, `sma`, `rsi`)
-   Classes: PascalCase (e.g., `Series`, `Context`)
-   Private methods: prefix with `_` (e.g., `_initializeState`)
-   State keys: use `_callId` or descriptive string

### Comments

-   Explain WHY, not WHAT
-   Document non-obvious behavior
-   Add warnings for critical sections

## Git Workflow

### Commits

-   Write clear, descriptive commit messages
-   Reference issue numbers when applicable
-   Keep commits focused and atomic

### Branches

-   Feature branches: `feature/description`
-   Bug fixes: `fix/description`
-   Optimizations: `optimization/description`

### Pull Requests

-   Include test coverage
-   Update documentation if needed
-   Regenerate barrel files if adding namespace methods
-   Ensure all tests pass: `npm test -- --run`

## Performance Considerations

1. **Incremental Calculation**: O(1) per bar, not O(n)
2. **State Management**: Store only necessary data
3. **Series Wrapping**: Reuse Series objects when possible
4. **Avoid Redundant Calculations**: Cache expensive operations

## Debugging

### Enable Debug Output

```javascript
// In TA function
console.log(`[${_callId}] Current value:`, currentValue);
console.log(`[${_callId}] State:`, state);
```

### View Transpiled Code

```javascript
import { transpile } from './src/transpiler';

const userCode = ($) => {
    const { close } = $.data;
    const { ta } = $.pine;
    return ta.sma(close, 20);
};

const transpiledFn = transpile(userCode, { debug: true });
// debug: true prints the transpiled code to console during transpilation
```

### Check Context State

```javascript
console.log('Variables:', context.let);
console.log('TA State:', context.taState);
console.log('Current Index:', context.idx);
```

See [Debugging Guide](docs/architecture/debugging.md) for more techniques.

## Resources

-   **Architecture**: [docs/architecture/](docs/architecture/)
-   **API Coverage**: [docs/api-coverage/](docs/api-coverage/)
-   **Examples**: [docs/architecture/transpiler/examples.md](docs/architecture/transpiler/examples.md)
-   **Best Practices**: [docs/architecture/best-practices.md](docs/architecture/best-practices.md)

## Questions?

When in doubt:

1. Read the [Architecture Guide](docs/architecture/index.md)
2. Check [Best Practices](docs/architecture/best-practices.md)
3. Look at existing implementations in `src/namespaces/ta/methods/`
4. Run tests: `npm test -- --run`

## Summary

**Key Takeaways for AI Agents:**

-   ✅ Understand the two input types: Pine Script (with `//@version=5`) vs PineTS syntax
-   ✅ Pine Script goes through pineToJS first, then both paths merge in main transpiler
-   ✅ Forward storage, reverse access (use `$.get()` or `Series.from()`)
-   ✅ Incremental calculation with state (not recalculation)
-   ✅ Always use `_callId` parameter for state isolation
-   ✅ Return tuples as `[[...]]` (double brackets)
-   ✅ Use `context.precision()` for numeric outputs
-   ✅ Handle NaN inputs gracefully
-   ✅ Run tests with `npm test -- --run`
-   ✅ Regenerate barrel files after adding methods
-   ❌ Don't modify transpiler without deep understanding
-   ❌ Don't use direct array access for time-series data
-   ❌ Don't share state between function calls
-   ❌ Don't mix Pine Script and PineTS syntax in the same input
