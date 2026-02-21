# Namespaces

This directory contains implementations of Pine Script namespaces in PineTS.

## Overview

Pine Script uses concepts like polymorphism and method overloading that are not natively supported in JavaScript/TypeScript. To bridge this gap, PineTS employs several strategies to handle these special cases while maintaining Pine Script's expected behavior.

## Core Concepts

### The `param()` Method

Every namespace in PineTS implements a special `param()` method that acts as a parameter wrapper during transpilation. When the transpiler converts PineTS source code into executable code, it wraps all function arguments with `ns.param()` calls.

**Why is this necessary?**

In the Pine Script ecosystem, the same parameter can be treated either as a **series** (time-series data) or as a **primitive value** (scalar). Additionally, some namespaces require specific parameter processing. The `param()` method handles these transformations transparently.

**Example:**

Source code:

```javascript
ta.sma(close, 14);
```

Gets transpiled to:

```javascript
const p0 = ta.param(close, undefined, 'p0');
const p1 = ta.param(14, undefined, 'p1');
ta.sma(p0, p1, '_ta0');
```

This ensures that `close` (a series) and `14` (a scalar) are properly processed before being passed to the `sma()` function.

---

## PineTS Implementation Patterns

This section documents architectural decisions and code organization patterns internal to PineTS.

### Pattern #1: Auto-Generated Namespace Index Files

**Overview:** Individual methods in `methods/` folders are automatically composed into namespace classes via generation scripts.

**Affected Namespaces:**

- `ta` (Technical Analysis)
- `math` (Mathematical operations)
- `array` (Array operations)
- `map` (Map/dictionary operations)
- `matrix` (Matrix operations)
- `input` (User input handling)
- `request` (Multi-timeframe/symbol requests)

**Generation Scripts:**

```bash
npm run generate:ta-index
npm run generate:math-index
npm run generate:array-index
npm run generate:map-index
npm run generate:matrix-index
npm run generate:input-index
npm run generate:request-index
```

**When to Regenerate:** After adding new methods to a namespace's `methods/` folder, you must run the corresponding generation script to update the barrel file.

**Auto-Generated Marker:** Generated files include this header comment:

```typescript
// This file is auto-generated. Do not edit manually.
// Run: npm run generate:ta-index
```

**Location:** Generation scripts are located in the [`scripts/`](../../scripts) folder.

---

### Pattern #2: Object-Oriented Collections (Array, Map, Matrix)

**Overview:** The `array`, `map`, and `matrix` namespaces use a dual-layer architecture to support instance methods on collection objects.

**Architecture:**

1. **Namespace class** (`PineArray`, `PineMap`, `PineMatrix`) - Handles constructors and static operations
2. **Object class** (`PineArrayObject`, `PineMapObject`, `PineMatrixObject`) - Instances with methods

**Method Delegation Pattern:**

```typescript
// In PineArray class
this.push = (id: PineArrayObject, ...args: any[]) => id.push(...args);

// Usage
let arr = array.new(5, 0); // Returns PineArrayObject
array.push(arr, 10); // Delegates to arr.push(10)
```

**Why This Pattern?** Pine Script has instance methods on collections, but JavaScript doesn't natively support this pattern for custom types. The delegation pattern bridges this gap.

**Contrast:** Simpler namespaces (`ta`, `math`, `request`, `input`) don't need this dual-layer architecture since they don't have instance-specific state.

---

### Pattern #3: Namespace-Specific `param()` Implementations

**Overview:** The `param()` method is NOT uniform across namespaces. Each namespace has different runtime requirements, resulting in three distinct implementations.

#### Type A - State-Creating (ta, math)

Creates Series from scalars to maintain state across bars in `context.params`.

```typescript
// Creates Series from scalars, tracks in context.params
param(source, index, name) { /* ... */ }
```

**Files:**

- [`src/namespaces/ta/methods/param.ts`](ta/methods/param.ts)
- [`src/namespaces/math/methods/param.ts`](math/methods/param.ts)

#### Type B - Simple Unwrapping (input, array, map, matrix)

Just extracts the current value from a Series or primitive.

```typescript
// Just extracts current value
param(source, index) { return Series.from(source).get(index); }
```

**Files:**

- [`src/namespaces/array/methods/param.ts`](array/methods/param.ts)
- [`src/namespaces/input/methods/param.ts`](input/methods/param.ts)
- [`src/namespaces/map/methods/param.ts`](map/methods/param.ts)
- [`src/namespaces/matrix/methods/param.ts`](matrix/methods/param.ts)

#### Type C - Tuple Tracking (request)

Returns `[value, name]` tuple for expression tracking in multi-timeframe analysis.

```typescript
// Returns [value, name] for expression tracking
param(source, index, name) { /* ... */ return [val, name]; }
```

**File:** [`src/namespaces/request/methods/param.ts`](request/methods/param.ts)

**Why Different?** Each namespace has unique requirements:

- **ta/math:** Need to track scalar values as time-series for historical lookback
- **input/array/map/matrix:** Only need current values, no history tracking
- **request:** Must track expression names for caching multi-timeframe data

---

### Pattern #4: TA Namespace Call ID Injection

**Overview:** Only the `ta` namespace receives automatic `_callId` parameter injection by the transpiler.

**Transpiler Code:**

```typescript
// In src/transpiler/transformers/ExpressionTransformer.ts
if (namespace === 'ta') {
    node.arguments.push(scopeManager.getNextTACallId());
}
```

**Example Transformation:**

```javascript
// User code:
ta.sma(close, 20);
ta.sma(volume, 20);

// Transpiled:
ta.sma(close, 20, '_ta0');
ta.sma(volume, 20, '_ta1');
```

**Why Only TA?** Technical analysis functions require stateful incremental calculations (rolling windows, EMA calculations, etc.) and must isolate state between multiple calls with the same parameters. The unique call ID ensures each invocation maintains separate state.

**Other Namespaces:** Don't need this because they're either:

- **Stateless** (math operations)
- **Instance-based** (array/map/matrix have their own object instances)

---

### Pattern #5: Flexible Argument Parsing

**Overview:** PineTS supports two different argument parsing strategies depending on the namespace.

#### Strategy A - Positional + Object (Core functions)

Supports both positional and object-based arguments.

```javascript
plot(series, title, color, ...)         // positional
plot(series, { title, color, ... })     // or object
```

**Implementation:** Uses `parseArgsForPineParams()` with multiple signature patterns to detect which style is being used.

**Files:**

- [`src/namespaces/utils.ts`](utils.ts) - Generic parser
- Used by `plot`, `plotchar`, `indicator`, and other core functions

#### Strategy B - Object-Only (Input namespace)

Requires object-based arguments with named parameters.

```javascript
input.int({ defval: 10, title: 'Period', minval: 1 });
```

**Implementation:** Uses `parseInputOptions()` with specific signature patterns for input validation.

**File:** [`src/namespaces/input/utils.ts`](input/utils.ts)

**Why Different Strategies?**

- **Core functions:** Need flexibility for backward compatibility and ease of use
- **Input functions:** Benefit from explicit naming for clarity in user interface generation

---

## Pine Script Special Cases

This section documents Pine Script language features and quirks that PineTS must handle to maintain compatibility.

### Case #1: Properties as Both Getters and Functions

**Problem:** In Pine Script, some namespace properties can be accessed as both a field and a function with default parameters.

**Example:** `ta.tr` is equivalent to `ta.tr(false)` — accessing the property invokes the function with default arguments.

**Solution:** The transpiler converts all namespace property accesses into function calls. For instance:

- `ta.tr` → `ta.tr()`
- The `tr()` method then handles default arguments internally

**Side Effect:** This affects namespaces that expose constants (like `math.pi`). These constants must be implemented as functions that return the constant value:

```javascript
math.pi(); // Returns 3.141592653589793
```

---

### Case #2: Namespaces Callable as Functions

**Problem:** Some namespaces can be invoked directly as functions (with multiple options) while also exposing individual methods.

**Example:**

```javascript
input(); // Generic input with options
input.int(); // Specific integer input
input.time(); // Specific time input
input.string(); // Specific string input
```

**Solution:** The transpiler converts direct namespace calls to `namespace.any()` calls:

- `input(...)` → `input.any(...)`
- The `any()` method handles the generic case and delegates to appropriate sub-methods based on options

---

### Case #3: Functions as Both Methods and Type Namespaces

**Problem:** Some functions also serve as namespaces for related constants and enums.

**Example:** `hline()` can be called as a function, but also provides style constants:

```javascript
hline(50); // Function call
hline.style_dashed; // Style constant
hline.style_dotted; // Style constant
```

**Solution:** We implement these as namespace objects with:

1. An `any()` method to handle function calls
2. Getter properties to expose constants and enum values

This follows the same pattern as Case #2, ensuring consistent behavior across both use cases.

---

### Case #4: Tuple Returns (Multiple Values)

**Problem:** Pine Script allows functions to return multiple values as tuples, which must be destructured by the caller.

**Solution:** PineTS uses a double bracket convention: `[[val1, val2, val3]]`

**Examples:**

```javascript
[macd, signal, hist] = ta.macd(close, 12, 26, 9);
[upper, middle, lower] = ta.bb(close, 20, 2);
```

**Structure:**

- **Outer array:** Represents the Series/time-series wrapper
- **Inner array:** Contains the actual tuple values

**Functions Using This Pattern:**
Only a few TA functions return tuples:

- `ta.macd()` → `[macdLine, signalLine, histogram]`
- `ta.bb()` → `[upper, middle, lower]`
- `ta.dmi()` → `[plusDI, minusDI, adx]`
- `ta.kc()` → `[upper, basis, lower]`
- `ta.supertrend()` → `[supertrend, direction, ...]`

---

### Case #5: NaN and Floating-Point Equality

**Problem:** Pine Script treats NaN comparisons specially and uses epsilon-based equality for floating-point numbers.

**Solution:** The transpiler transforms `==` operators to `math.__eq()` calls in a post-processing step.

**Implementation:** The `math.__eq()` function uses:

- **1e-8 tolerance** for floating-point comparisons
- **Special NaN handling:** Treats `NaN == NaN` as `true` (unlike JavaScript's standard behavior)

**Example:**

```javascript
// Pine Script
if (value == previousValue)

// Transpiled
if (math.__eq(value, previousValue))
```

**Reference:** [`src/namespaces/math/methods/__eq.ts`](math/methods/__eq.ts)
