---
layout: default
title: Transpilation Examples
parent: Transpiler
nav_order: 3
permalink: /architecture/transpiler/examples/
---

# Real Transpilation Examples

This page shows actual transpiler output to help understand the transformation process.

## Example 1: Basic Variable Assignment

**Input:**

```javascript
let sma = ta.sma(close, 20);
```

**Transpiled Output:**

```javascript
const { close } = $.data;
const ta = $.ta;
const p0 = ta.param(close, undefined, 'p0');
const p1 = ta.param(20, undefined, 'p1');
const temp_1 = ta.sma(p0, p1, '_ta0');
$.let.glb1_sma = $.init($.let.glb1_sma, temp_1);
```

**Key Transformations:**

- Implicit imports injected (`close`, `ta`)
- Arguments wrapped in `ta.param()` with unique IDs (`p0`, `p1`)
- Function call receives unique call ID (`_ta0`)
- Nested call hoisted to temporary variable (`temp_1`)
- Variable renamed with scope prefix (`glb1_sma`)
- Assignment wrapped in `$.init()`

## Example 2: Array Access and Assignment

**Input:**

```javascript
let prev_close = close[1];
cc = close[2];
```

**Transpiled Output:**

```javascript
const { close } = $.data;
$.let.glb1_prev_close = $.init($.let.glb1_prev_close, $.get(close, 1));
$.set($.let.glb1_cc, $.get(close, 2));
```

**Key Transformations:**

- `close[1]` → `$.get(close, 1)` (Pine Script semantics)
- `cc = close[2]` → `$.set($.let.glb1_cc, $.get(close, 2))`
- Series access translated to context methods

## Example 3: Binary Operations

**Input:**

```javascript
const green_candle = close > open;
const bull_bias = ema9 > ema18;
```

**Transpiled Output:**

```javascript
const { close, open } = $.data;
$.const.glb1_green_candle = $.init($.const.glb1_green_candle, $.get(close, 0) > $.get(open, 0));
$.const.glb1_bull_bias = $.init($.const.glb1_bull_bias, $.get($.const.glb1_ema9, 0) > $.get($.const.glb1_ema18, 0));
```

**Key Transformations:**

- Binary operations preserve structure
- Series values extracted with `$.get(series, 0)`
- User variables accessed through context (`$.const.glb1_ema9`)

## Example 4: Nested Function Calls (Expression Hoisting)

**Input:**

```javascript
let d = ta.ema(math.abs(ap - 99), 10);
```

**Transpiled Output:**

```javascript
const ta = $.ta;
const math = $.math;
const p0 = math.param($.get($.let.glb1_ap, 0) - 99, undefined, 'p0');
const temp_1 = math.abs(p0);
const p1 = ta.param(temp_1, undefined, 'p1');
const p2 = ta.param(10, undefined, 'p2');
const temp_2 = ta.ema(p1, p2, '_ta0');

$.let.glb1_d = $.init($.let.glb1_d, temp_2);
```

**Key Transformations:**

- Nested `math.abs(ap - 99)` hoisted to `temp_1`
- Each function call isolated with unique IDs
- Inner function executed first, result passed to outer function
- Ensures proper execution order for stateful functions

## Example 5: Scoped Variables (If Statement)

**Input:**

```javascript
let aa = 0;
if (_cc > 1) {
    let bb = 1;
    aa = 1;
}
```

**Transpiled Output:**

```javascript
$.let.glb1_aa = $.init($.let.glb1_aa, 0);
if ($.get($.const.glb1__cc, 0) > 1) {
    $.let.if2_bb = $.init($.let.if2_bb, 1); // Scoped to 'if2'
    $.set($.let.glb1_aa, 1); // Updates global scope
}
```

**Key Transformations:**

- Global variable: `glb1_aa`
- If-scoped variable: `if2_bb` (different prefix)
- Assignment to existing variable uses `$.set()`
- New variable declaration uses `$.init()`

## Example 6: Equality Checks (NaN Handling)

**Input:**

```javascript
if (avg_len === 0) {
    ret_val = cc[1];
}
```

**Transpiled Output:**

```javascript
if ($.math.__eq($.get(avg_len, 0), 0)) {
    $.set($.let.fn2_ret_val, $.get($.let.fn2_cc, 1));
}
```

**Key Transformations:**

- `===` → `$.math.__eq()` (handles `NaN == NaN` correctly)
- Variables accessed with `$.get()`
- Assignment uses `$.set()`

## Example 7: Array Pattern Destructuring

**Input:**

```javascript
let [a, b] = ta.supertrend(close, 10, 3);
```

**Transpiled Output:**

```javascript
const p0 = ta.param(close, undefined, 'p0');
const p1 = ta.param(10, undefined, 'p1');
const p2 = ta.param(3, undefined, 'p2');
const temp_1 = ta.supertrend(p0, p1, p2, '_ta0');

let a = $.init($.let.glb1_a, $.get($.const.glb1_temp_1, 0)[0]);
let b = $.init($.let.glb1_b, $.get($.const.glb1_temp_1, 0)[1]);
```

**Key Transformations:**

- Function call hoisted to `temp_1`
- Destructuring split into individual assignments
- Each element accessed via `$.get(temp, 0)[index]`
- Tuple convention: `[[a, b]]` returned by function, destructured here

## Example 8: Array Expression in request.security

**User Variables:**

```javascript
const o = open;
const c = close;
const [res, data] = await request.security('BTCUSDC', '240', [o, c], false, false);
```

**Transpiled Output:**

```javascript
$.const.glb1_o = $.init($.const.glb1_o, open);
$.const.glb1_c = $.init($.const.glb1_c, close);
const p2 = request.param([$.get($.const.glb1_o, 0), $.get($.const.glb1_c, 0)], undefined, 'p2');
const temp_1 = await request.security('BTCUSDC', '240', p2, false, false);
// ... destructuring follows
```

**Direct Series:**

```javascript
const [res, data] = await request.security('BTCUSDC', '240', [open, close], false, false);
```

**Transpiled Output:**

```javascript
const p2 = request.param([open, close], undefined, 'p2');
const temp_1 = await request.security('BTCUSDC', '240', p2, false, false);
// ... destructuring follows
```

**Key Transformations:**

- User variables in arrays: `[o, c]` → `[$.get(o, 0), $.get(c, 0)]`
- Direct Series: `[open, close]` → passed through unchanged
- `request.param()` handles tuple detection internally

## Example 9: For Loop with Scope

**Input:**

```javascript
let sum = 0;
for (let i = 0; i < 10; i++) {
    sum += values[i];
}
```

**Transpiled Output:**

```javascript
$.let.glb1_sum = $.init($.let.glb1_sum, 0);
for (let i = 0; i < 10; i++) {
    // Loop variable NOT transformed
    $.set($.let.glb1_sum, $.get($.let.glb1_sum, 0) + $.get($.let.glb1_values, i));
}
```

**Key Transformations:**

- Loop variable `i` remains unchanged (not a time-series)
- `sum` transformed to `$.let.glb1_sum`
- Compound assignment `+=` becomes explicit get/set
- `values[i]` uses standard array access (not Pine Script semantics)

## Data Flow Visualization

### Variable Assignment Flow

```
User Code: let ema9 = ta.ema(close, 9);
                ↓
        Transpiler Analysis
                ↓
    ┌───────────────────────┐
    │ 1. Inject imports     │
    │    const { close } =  │
    │    $.data             │
    └───────────┬───────────┘
                ↓
    ┌───────────────────────┐
    │ 2. Wrap arguments     │
    │    p0 = ta.param(...) │
    │    p1 = ta.param(...) │
    └───────────┬───────────┘
                ↓
    ┌───────────────────────┐
    │ 3. Add call ID        │
    │    ta.ema(p0, p1,     │
    │    '_ta0')            │
    └───────────┬───────────┘
                ↓
    ┌───────────────────────┐
    │ 4. Hoist to temp      │
    │    temp_1 = ...       │
    └───────────┬───────────┘
                ↓
    ┌───────────────────────┐
    │ 5. Rename variable    │
    │    glb1_ema9          │
    └───────────┬───────────┘
                ↓
    ┌───────────────────────┐
    │ 6. Wrap in $.init()   │
    │    $.let.glb1_ema9 =  │
    │    $.init(...)        │
    └───────────────────────┘
```

## Understanding the Transformation Rules

| Original Pattern     | Transformed Pattern                           | Reason                            |
| -------------------- | --------------------------------------------- | --------------------------------- |
| `let x = value`      | `$.let.scope_x = $.init(...)`                 | State persistence                 |
| `x = value`          | `$.set($.let.scope_x, value)`                 | Update current value              |
| `x[1]`               | `$.get(x, 1)`                                 | Pine Script indexing              |
| `func(arg)`          | `func(ns.param(arg, undefined, 'p0'), '_id')` | Series wrapping + state isolation |
| `a == b`             | `$.math.__eq(a, b)`                           | NaN comparison                    |
| `const [a, b] = f()` | Split into individual inits                   | Tuple destructuring               |
