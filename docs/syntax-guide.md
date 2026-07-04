---
layout: default
title: Syntax Guide
nav_order: 8
---

# PineTS Syntax Guide

This guide explains how to write PineTS code that is equivalent to Pine Script. PineTS is designed to be written in JavaScript/TypeScript but behaves like Pine Script's runtime execution model.

## Variable Declarations

PineTS distinguishes between `let` and `var` declarations to mimic Pine Script's behavior. This is a critical difference from standard JavaScript.

### `let` vs `var`

| Feature               | Pine Script         | PineTS (JS/TS)  | Behavior                                                                             |
| :-------------------- | :------------------ | :-------------- | :----------------------------------------------------------------------------------- |
| **Re-initialization** | `float x = close`   | `let x = close` | Variable is re-initialized/calculated **on every bar**.                              |
| **State Persistence** | `var float x = 0.0` | `var x = 0.0`   | Variable is initialized **only once** (first bar) and retains its value across bars. |

**⚠️ Important for JS Developers:** In PineTS, `var` does **not** behave like standard JavaScript `var`. It adopts Pine Script's `var` semantics (persistent state). If you need standard JS function-scoped variables that reset every time, use `let`.

#### Example: State Persistence

**Pine Script:**

```pinescript
// 'sum' retains its value across bars
var float sum = 0.0
sum := sum + close
```

**PineTS:**

```javascript
// 'sum' retains its value across bars
var sum = 0.0;
sum = sum + close;
```

## Loops

PineTS supports standard JavaScript loops, which map to Pine Script's loops.

| Feature        | Pine Script       | PineTS (JS/TS)                  |
| :------------- | :---------------- | :------------------------------ |
| **For Loop**   | `for i = 0 to 10` | `for (let i = 0; i <= 10; i++)` |
| **While Loop** | `while i < 10`    | `while (i < 10)`                |

#### Example: For Loop

**Pine Script:**

```pinescript
float sum = 0.0
for i = 0 to 9
    sum := sum + close[i]
```

**PineTS:**

```javascript
let sum = 0.0;
for (let i = 0; i < 10; i++) {
    sum += close[i];
}
```

## Control Structures

### Switch Statement

PineTS supports the JavaScript `switch` statement, which is equivalent to Pine Script's `switch`.

**Pine Script:**

```pinescript
switch type
    "ema" => ta.ema(close, len)
    "sma" => ta.sma(close, len)
    => ta.rma(close, len)
```

**PineTS:**

```javascript
switch (type) {
    case 'ema':
        return ta.ema(close, len);
    case 'sma':
        return ta.sma(close, len);
    default:
        return ta.rma(close, len);
}
```

## Functions

User-defined functions in PineTS are written as standard JavaScript functions.

**Pine Script:**

```pinescript
f_ma(source, length) =>
    ta.sma(source, length)
```

**PineTS:**

```javascript
function f_ma(source, length) {
    return ta.sma(source, length);
}
```

## Tuples and Multiple Return Values

Pine Script allows functions to return multiple values (tuples). PineTS handles this using array destructuring.

**Pine Script:**

```pinescript
[macdLine, signalLine, histLine] = ta.macd(close, 12, 26, 9)
```

**PineTS:**

```javascript
const [macdLine, signalLine, histLine] = ta.macd(close, 12, 26, 9);
```

## Series and History Access

Accessing historical values is done using the `[]` operator in Pine Script. In PineTS, array access syntax is supported and transpiled to safe series access.

| Feature            | Pine Script | PineTS (JS/TS) | Notes                               |
| :----------------- | :---------- | :------------- | :---------------------------------- |
| **Current Value**  | `close`     | `close`        | References the current bar's value. |
| **Previous Value** | `close[1]`  | `close[1]`     | References the value 1 bar ago.     |
| **History Access** | `close[10]` | `close[10]`    | References the value 10 bars ago.   |

**PineTS:**

```javascript
// Calculate momentum
let mom = close - close[10];
```

## Conditional Logic

PineTS supports standard JavaScript control flow, which maps to Pine Script's execution model.

| Feature          | Pine Script                                     | PineTS (JS/TS)                                             | Notes               |
| :--------------- | :---------------------------------------------- | :--------------------------------------------------------- | :------------------ |
| **If Statement** | `if condition`<br>&nbsp;&nbsp;&nbsp;&nbsp;`...` | `if (condition) {`<br>&nbsp;&nbsp;&nbsp;&nbsp;`...`<br>`}` | Standard JS syntax. |
| **Ternary**      | `cond ? val1 : val2`                            | `cond ? val1 : val2`                                       | Standard JS syntax. |

#### Example: Trend Direction

**Pine Script:**

```pinescript
if close > open
    direction := 1
else
    direction := -1
```

**PineTS:**

```javascript
if (close > open) {
    direction = 1;
} else {
    direction = -1;
}
```

### Always brace your `if` / `for` / `while` bodies

> **The rule:** In the JS callback form, **every control-flow body must be wrapped in `{ ... }`** — even single statements.

JavaScript itself allows brace-less single-statement bodies (`if (cond) stmt;`). PineTS does not. If the body contains any Pine namespace call (`strategy.entry`, `ta.sma`, `plot`, `line.new`, `label.new`, ...), brace-less bodies produce silent bugs.

**Why.** The PineTS transpiler rewrites Pine-style calls into a "compute first, use second" form — `strategy.entry('e', strategy.long, 1)` becomes a few `const p_N = strategy.param(...)` declarations followed by `const temp_N = strategy.entry(...)`. Those `pN` / `temp_N` declarations are **hoisted**: they must be emitted *before* the statement that needs them, and they must land in the smallest enclosing `BlockStatement` so that they execute only when that block does.

The transpiler's hoisting walker only has a hook for `BlockStatement`. When the body of an `if` / `for` / `while` is a plain single statement (brace-less), there is no inner block to catch the hoisted declarations — they fall through to the next enclosing block (typically the parent function body) and end up executing on every bar, ignoring the condition or the loop counter.

Pine source isn't affected because Pine's indentation-scoped bodies are *always* emitted as a `BlockStatement` by the Pine → JS codegen, regardless of how many statements they contain.

#### Example 1 — `if` body

```javascript
// ❌ WRONG — strategy.entry() fires on EVERY bar.
if ($.idx === 1) strategy.entry('e', strategy.long, 1);

// ✅ CORRECT
if ($.idx === 1) { strategy.entry('e', strategy.long, 1); }
```

What the transpiler emits in the wrong case:

```javascript
const temp_3 = strategy.entry(p2, temp_2, p3);   // ← runs every bar
if ($.idx === 1) temp_3;                          // ← reads value, no-op
```

#### Example 2 — `for` body

```javascript
// ❌ WRONG — strategy.order() runs ONCE, not 3 times.
for (let k = 0; k < 3; k++) strategy.order('o' + k, strategy.long, 1);

// ✅ CORRECT
for (let k = 0; k < 3; k++) { strategy.order('o' + k, strategy.long, 1); }
```

What the transpiler emits in the wrong case:

```javascript
const p2 = strategy.param('o' + k, ...);          // ← `k` not in scope yet — ReferenceError
const temp_3 = strategy.order(p2, temp_2, p3);    // ← runs once, before the loop
for (let k = 0; k < 3; k++) temp_3;               // ← loop reads the same temp
```

The same applies to `while` bodies and brace-less `else` branches.

> If a single-statement body contains *no* Pine namespace call (pure JS arithmetic, plain variable assignment, a `console.log`, etc.), no hoisting happens and brace-less is harmless. The safe default is to always use braces.

## Built-in Variables

PineTS exposes Pine Script's built-in variables through the `context` object, but usually, you destructure them for easier access.

| Variable        | Pine Script | PineTS (JS/TS)                    |
| :-------------- | :---------- | :-------------------------------- |
| **Close Price** | `close`     | `close` (from `context.data`)     |
| **Open Price**  | `open`      | `open` (from `context.data`)      |
| **High Price**  | `high`      | `high` (from `context.data`)      |
| **Low Price**   | `low`       | `low` (from `context.data`)       |
| **Volume**      | `volume`    | `volume` (from `context.data`)    |
| **Bar Index**   | `bar_index` | `bar_index` (from `context.pine`) |

**PineTS Setup:**

```javascript
const { close, high, low } = context.data;
const { bar_index } = context.pine;
```

## Functions and Namespaces

PineTS organizes built-in functions into namespaces similar to Pine Script v5.

| Namespace              | Pine Script | PineTS (JS/TS) | Example                 |
| :--------------------- | :---------- | :------------- | :---------------------- |
| **Technical Analysis** | `ta.*`      | `ta.*`         | `ta.sma(close, 14)`     |
| **Math**               | `math.*`    | `math.*`       | `math.max(high, low)`   |
| **Request**            | `request.*` | `request.*`    | `request.security(...)` |

**PineTS Setup:**

```javascript
const { ta, math } = context.pine;
// Usage
const sma = ta.sma(close, 14);
```

## Full Example: Parabolic SAR

This example demonstrates `var` for state, `if/else` logic, and history access.

**Pine Script:**

```pinescript
pine_sar(start, inc, max) =>
    var float result = na
    var float maxMin = na
    var float acceleration = na
    var bool isBelow = false
    bool isFirstTrendBar = false

    if bar_index == 1
        if close > close[1]
            isBelow := true
            maxMin := high
            result := low[1]
        else
            isBelow := false
            maxMin := low
            result := high[1]
        isFirstTrendBar := true
        acceleration := start

    // ... logic continues ...
    result
```

**PineTS:**

```javascript
function pine_sar(start, inc, max) {
    // Use 'var' for state variables (persistent)
    var result = na;
    var maxMin = na;
    var acceleration = na;
    var isBelow = false;

    // Use 'let' for temporary variables (reset every bar)
    let isFirstTrendBar = false;

    if (bar_index == 1) {
        if (close > close[1]) {
            isBelow = true;
            maxMin = high;
            result = low[1];
        } else {
            isBelow = false;
            maxMin = low;
            result = high[1];
        }
        isFirstTrendBar = true;
        acceleration = start;
    }

    // ... logic continues ...

    return result;
}
```
