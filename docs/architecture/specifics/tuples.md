---
layout: default
title: Tuple Handling
parent: Specifics
nav_order: 1
permalink: /architecture/specifics/tuples/
---

# Tuple Handling Architecture

Pine Script supports tuples (functions returning `[a, b]`). PineTS has a specific architecture to handle this while distinguishing tuples from time-series arrays.

## The Problem

Distinguishing between:
1.  **Tuple**: `[val1, val2]` (Result of `ta.macd(...)`)
2.  **Time-Series Array**: `[bar0, bar1, bar2]` (History of a variable)

## The Solution

### 1. Double Bracket Convention `[[...]]`

Functions that return tuples must wrap them in an outer array:

```typescript
// Implementation of a tuple-returning function
return [[macd, signal, hist]];
```

### 2. `Context.init` Detection

When assigning a variable, `Context.init` checks the structure:

```typescript
if (Array.isArray(src)) {
    if (Array.isArray(src[0])) {
        // It's a tuple wrapped in 2D array [[a, b]]
        // Extract inner array
        value = src[0]; 
    } else {
        // It's a 1D history array [old, ..., new]
        // Extract last element
        value = src[src.length - 1];
    }
}
```

### 3. `request.security` Tuple Handling

`request.security` also follows this convention. If the requested expression returns a tuple, `security` wraps the result in `[[...]]` before returning it to the primary context.

### 4. Transpiler Destructuring

The transpiler handles the destructuring assignment:

```javascript
// User: const [a, b] = func();
// Transpiled: 
// const temp = $.init(..., $.toTuple(func(), 2));
// const a = $.init(..., $.get(temp, 0)[0]);
// const b = $.init(..., $.get(temp, 0)[1]);
```

`$.toTuple(value, arity)` normalizes whatever the right-hand side produced to the double-bracket form, because not every tuple source is a function return:

- `[[a, b]]` (function return, `request.security`, built-ins such as `ta.macd`) passes through.
- `[a, b]` (an `if` / `switch` / loop expression, a function returning a `switch`) is wrapped. No Pine value is a JS array, so a flat array here is never a history array.
- `na` (an `if` without `else`, a loop that never ran) becomes `[[na, na]]`, matching TradingView.

### 5. Tuple forms the parser rejects

As on TradingView, a tuple is only valid as the value of a local block (function, `if`, `switch`, loop) or as the `expression` argument of `request.*()` / the `options` argument of `input.*()`. The Pine parser rejects, with TradingView's messages: ternaries returning tuples, bare tuple literals (`u = [a, b]`, `[u, v] = [a, b]`), type keywords or duplicate names in a tuple declaration, `[a, b] := ...`, tuples passed to other functions, a tuple-returning call assigned to a single variable, and name-count mismatches when the function's tuple size is known statically.

