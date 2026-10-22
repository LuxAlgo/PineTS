---
layout: default
title: Property-Like Access
parent: Namespaces
nav_order: 6
permalink: /architecture/namespaces/property-access/
---

# Property-Like Access in PineTS

This document explains how PineTS handles Pine Script's property-like syntax where namespace members can be accessed without parentheses.

## The Problem

In Pine Script, namespace members can be accessed without parentheses:

```pinescript
// Pine Script - property-like access
tr1 = ta.tr           // No parentheses
tr2 = ta.tr(true)     // With parameter
pi = math.pi          // Constant access
```

This creates a challenge in JavaScript/TypeScript where methods require parentheses to be called.

## PineTS Unified Solution

**PineTS takes a simplified approach**: Everything in namespaces is implemented as a **method**, and the transpiler automatically converts property access to method calls. This eliminates the complexity of maintaining separate getters and methods.

### Why This Approach?

1. **Simplicity**: Single implementation pattern for all namespace members
2. **No special cases**: No need to distinguish between "getters" and "methods"
3. **Transpiler handles it**: The conversion happens at transpile time, not runtime
4. **Flexibility**: Easy to add optional parameters to any function later
5. **Maintainability**: Less code, fewer edge cases to handle

### Architecture

```
┌─────────────────────────────────────────────────┐
│  User Code: ta.tr                            │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Transpiler: Detects namespace method access │
│  without parentheses                         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Transformed Code: ta.tr()                   │
└─────────────────────────────────────────────────┘
```

### How It Works

#### 1. Implementation (All Methods)

All getter-like functions are implemented as **regular methods** with optional parameters:

```typescript
// src/namespaces/ta/methods/tr.ts
export function tr(context: any) {
    return (handle_na?: any) => {
        // Default parameter value
        const handleNa = handle_na !== undefined ? Series.from(handle_na).get(0) : true;

        const high0 = context.get(context.data.high, 0);
        const low0 = context.get(context.data.low, 0);
        const close1 = context.get(context.data.close, 1);

        if (isNaN(close1)) {
            return handleNa ? high0 - low0 : NaN;
        }

        return Math.max(high0 - low0, Math.abs(high0 - close1), Math.abs(low0 - close1));
    };
}
```

#### 2. Transpiler Detection

The transpiler's `transformMemberExpression` function detects namespace method access:

```typescript
// Checks for known namespaces
const KNOWN_NAMESPACES = ['ta', 'math', 'request', 'array', 'input'];

const isDirectNamespaceMemberAccess =
    memberNode.object && memberNode.object.type === 'Identifier' && KNOWN_NAMESPACES.includes(memberNode.object.name) && !memberNode.computed;

// If not already being called, add parentheses
if (!isAlreadyBeingCalled) {
    // Convert to: namespace.method()
}
```

#### 3. Transformation Examples

```javascript
// ✅ Property access → Method call (for all namespace members)
ta.tr          →  ta.tr()
math.pi        →  math.pi()
ta.ema         →  ta.ema()

// ✅ Already a method call → Pass through
ta.tr()        →  ta.tr()
ta.tr(true)    →  ta.tr(true)
math.pi()      →  math.pi()

// ✅ Variable assignment → No transformation
const myTa = context.ta;
myTa.tr        →  myTa.tr  (unchanged)
```

### Smart Detection

The transpiler only transforms **direct namespace access** to avoid false positives:

```javascript
// ✅ Transformed: Direct namespace
const tr = ta.tr; // → ta.tr()

// ❌ Not transformed: Variable holds namespace
const myTa = context.ta;
const tr = myTa.tr; // No change (myTa is not a known namespace)

// ✅ Not transformed: Already in a call
ta.tr(); // Already a call, no change needed

// ✅ Not transformed: In destructuring
const { tr } = ta; // Part of destructuring, no change
```

## Usage Examples

### Basic Usage

```javascript
const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '1h', 100);

const sourceCode = (context) => {
    const { ta } = context.pine;

    // All these work correctly:
    const tr1 = ta.tr; // Auto-converted to ta.tr()
    const tr2 = ta.tr(); // Explicit call, default parameter
    const tr3 = ta.tr(true); // With parameter: handle_na = true
    const tr4 = ta.tr(false); // With parameter: handle_na = false

    return { tr1, tr2, tr3, tr4 };
};

const { result } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });
```

### With Optional Parameters

```javascript
// Without parameter - uses default
const tr = ta.tr; // Auto-converted to ta.tr(), handle_na defaults to true

// With explicit parameter
const trWithNA = ta.tr(true); // Returns high-low when close[1] is NaN
const trStrict = ta.tr(false); // Returns NaN when close[1] is NaN
```

### Constants

Even constants are implemented as methods for consistency:

```javascript
// All converted to method calls
const pi = math.pi; // → math.pi() returns 3.14159...
const e = math.e; // → math.e() returns 2.71828...

// Implementation is simple:
export function pi(context: any) {
    return () => Math.PI;
}
```

## Implementation Guide

### For New Getter-Like Methods

When implementing a new function that should work as both a property and method:

#### Step 1: Create Method File

Place in `src/namespaces/{namespace}/methods/yourfunction.ts`:

```typescript
import { Series } from '../../../Series';

export function yourFunction(context: any) {
    return (optionalParam?: any) => {
        // Extract parameter with default
        const param = optionalParam !== undefined
            ? Series.from(optionalParam).get(0)
            : defaultValue;

        // Implementation
        const result = /* ... calculation ... */;

        return context.precision(result);
    };
}
```

#### Step 2: Regenerate Barrel File

```bash
npm run generate:ta-index
# or
npm run generate:math-index
# etc.
```

#### Step 3: Add Tests

Test both syntaxes in your test file:

```typescript
it('should work without parentheses', async () => {
    const sourceCode = (context) => {
        const { ta } = context.pine;
        const result = ta.yourFunction; // No parentheses
        return { result };
    };
    // ... assertions
});

it('should work with parameter', async () => {
    const sourceCode = (context) => {
        const { ta } = context.pine;
        const result = ta.yourFunction(true); // With parameter
        return { result };
    };
    // ... assertions
});
```

### Converting Existing Getters

If you have an existing getter in `getters/` directory, convert it to a method:

1. **Move** the file to `methods/` directory
2. **Keep the same signature** (or add optional parameters if needed)
3. **Regenerate** the barrel file
4. **Delete** the old getter file

Example migration:

```typescript
// OLD: getters/obv.ts (JavaScript getter)
export function obv(context: any) {
    return () => {
        // ... implementation
        return obvValue;
    };
}

// NEW: methods/obv.ts (method - same signature!)
export function obv(context: any) {
    return () => {
        // ... same implementation
        return obvValue;
    };
}
```

The transpiler handles the conversion from `ta.obv` to `ta.obv()`, so the implementation stays the same. You're just moving it from `getters/` to `methods/` for consistency.

## Benefits

### 1. Simplicity

-   Single implementation pattern for all functions
-   No special getter/method dual implementations
-   Easier to maintain and understand

### 2. Flexibility

-   Easy to add optional parameters to existing functions
-   Can extend functionality without breaking changes
-   Backward compatible with property access syntax

### 3. Type Safety

-   TypeScript can properly type-check method signatures
-   IDE autocomplete works correctly
-   Better developer experience

### 4. Performance

-   No overhead from property getters being called repeatedly
-   Transpilation happens once, not at runtime
-   Same performance as regular method calls

### 5. Pine Script Compatibility

-   Matches Pine Script's property-like access syntax
-   Users can write code that looks like Pine Script
-   Smooth migration path from Pine Script

### 6. No Runtime Overhead

-   No JavaScript getters being invoked
-   No property descriptor lookups
-   Direct method calls after transpilation

## Limitations

### Variable Assignment Edge Case

When a namespace is assigned to a variable, the transformation doesn't apply:

```javascript
// This works
const tr = ta.tr; // → ta.tr()

// This doesn't transform
const myTa = context.ta;
const tr = myTa.tr; // Not transformed (myTa is not a known namespace)

// Workaround: Use explicit call
const tr = myTa.tr(); // ✅ Works
```

**Reason**: The transpiler only recognizes direct access to known namespace identifiers (`ta`, `math`, etc.) to avoid false positives.

### Destructuring

Destructured methods need explicit calls:

```javascript
// Doesn't auto-transform
const { tr } = ta;
const value = tr; // Need: tr()

// Workaround: Call explicitly
const value = tr(); // ✅ Works
```

## Universal Application

### Everything is a Method

This transpiler-based approach applies to **all namespace members** - no exceptions:

```javascript
// ✅ Indicators with optional parameters
ta.tr; // → ta.tr()
ta.tr(true); // → ta.tr(true)

// ✅ Indicators with required parameters
ta.ema; // → ta.ema() (will need params from transpiler)
ta.ema(close, 14); // → ta.ema(close, 14)

// ✅ Constants (implemented as zero-parameter methods)
math.pi; // → math.pi()
math.e; // → math.e()

// ✅ Any namespace member
array.size; // → array.size()
request.security; // → request.security()
```

### Implementation Consistency

**All namespace members follow the same pattern:**

```typescript
// Constant (zero parameters)
export function pi(context: any) {
    return () => Math.PI;
}

// Indicator with optional parameter
export function tr(context: any) {
    return (handle_na?: any) => {
        const handleNa = handle_na !== undefined ? Series.from(handle_na).get(0) : true;
        // ... calculation
    };
}

// Indicator with required parameters
export function ema(context: any) {
    return (source: any, length: any, _callId?: string) => {
        // ... calculation
    };
}
```

All are methods, all work with the same transpiler transformation logic.

## Troubleshooting

### Method Not Being Called

**Problem**: `ta.tr` returns a function instead of a value.

**Solution**: Check that:

1. The namespace is in the `KNOWN_NAMESPACES` list in the transpiler
2. You're using direct namespace access (not through a variable)
3. The barrel file was regenerated after adding the method

### Parameter Not Working

**Problem**: Parameter is ignored or causes an error.

**Solution**: Ensure:

1. The method signature includes the optional parameter
2. You're using `Series.from()` to extract the parameter value
3. You're providing a default value for backward compatibility

### Tests Failing

**Problem**: Tests fail after converting from getter to method.

**Solution**: Update tests to:

1. Test both syntaxes (with and without parentheses)
2. Test with different parameter values
3. Verify default behavior matches old getter behavior

## See Also

-   [Namespace Architecture](./index.md)
-   [Technical Analysis (ta) Namespace](./ta.md)
-   [Best Practices](../best-practices.md)
-   [Transpiler Architecture](../transpiler/index.md)
