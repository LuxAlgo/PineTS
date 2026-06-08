---
layout: default
title: Indicator
nav_order: 4
permalink: /indicator/
---

# Indicator

`Indicator` is the SSOT wrapper around a Pine/JS script. It owns the source code, the transpiled function, the parsed input schema, and the parsed declaration-prop schema. You typically pass an `Indicator` to `pine.run()` / `pine.stream()` instead of a raw string — that gives you:

- Lazy, cached transpile (re-running the same Indicator across multiple `pine.run()` calls compiles the script **once**)
- A title-keyed `.input` view to read or override input defaults
- A name-keyed `.prop` view to read or override `indicator()` / `strategy()` declaration arguments
- Schema introspection (`getInputsMeta()`, `getPropsMeta()`) for UI builders

Every code snippet on this page is exercised by the verification harness at `PineTS/.scratchpad/indicator-doc-examples.cjs` (kept in lock-step with the docs during authoring). If something doesn't behave as documented, the harness fails.

## Table of Contents

- [Quickstart](#quickstart)
- [Constructor](#constructor)
- [Indicator.from()](#indicatorfrom)
- [Visible-range detection](#visible-range-detection)
- [Inputs — `.input` and `getInputsMeta()`](#inputs--input-and-getinputsmeta)
- [Declaration props — `.prop` and `getPropsMeta()`](#declaration-props--prop-and-getpropsmeta)
- [Reusing the same Indicator across runs](#reusing-the-same-indicator-across-runs)
- [JS-function source](#js-function-source)
- [Backward compatibility — constructor `inputs` map](#backward-compatibility--constructor-inputs-map)

---

## Quickstart

The simplest path — wrap a Pine string in `new Indicator(...)`, pass it to `pine.run()`:

```javascript
const { PineTS, Indicator } = require('pinets');

const code = `
//@version=6
indicator("SMA Demo")
len = input.int(14, "Length")
plot(ta.sma(close, len))
`;

const ind = new Indicator(code);
const pine = new PineTS(/* market data or provider */);
const ctx = await pine.run(ind);
```

Raw strings and raw functions also work — they get wrapped in a throwaway Indicator internally:

```javascript
await pine.run(code); // raw Pine string
await pine.run(($) => {
    /* ... */
}); // raw JS function
```

You'd choose the explicit `Indicator` form when you want to:

- Override input or prop values before the run.
- Reuse the same compiled script across multiple `pine.run()` calls.
- Inspect the script's schema from the host UI.

---

## Constructor

```typescript
new Indicator(source: string | Function, inputs?: Record<string, unknown>)
```

| Argument | Type                                             | Required | Notes                                                                                 |
| -------- | ------------------------------------------------ | -------- | ------------------------------------------------------------------------------------- |
| `source` | `string` (Pine code) or `Function` (JS callback) | Yes      | The script body.                                                                      |
| `inputs` | `Record<string, unknown>`                        | No       | **Legacy** — title-keyed override map. Kept for back-compat; prefer the `.input` API. |

Both forms accepted:

```javascript
// Pine string source
const a = new Indicator(`
//@version=6
indicator("X")
plot(close)
`);

// JS function source
const b = new Indicator(($) => {
    const { indicator, plot } = $.pine;
    indicator('JS X');
    plot($.data.close);
});
```

---

## Indicator.from()

A static normalizer used by `pine.run()` and friends. Accepts any of the three input shapes and returns an `Indicator`:

```javascript
Indicator.from(code); // wraps the raw Pine string
Indicator.from(($) => {
    /* ... */
}); // wraps the raw function
Indicator.from(existingInd) === existingInd; // pass-through
```

Use it when you write code that needs to operate on Indicators regardless of how the user provided the source.

---

## Visible-range detection

Statically tags whether the script references any host-bound built-in (`chart.left_visible_bar_time`, `chart.right_visible_bar_time`, …). Used by `pine.update()` to skip re-runs for non-viewport scripts.

```javascript
const vr = new Indicator(`
//@version=6
indicator("VR", overlay=true)
left = chart.left_visible_bar_time
plot(close)
`);

const noVR = new Indicator(`//@version=6\nindicator("Plain")\nplot(close)`);

vr.usesVisibleRange(); // → true
noVR.usesVisibleRange(); // → false
```

See **[Initialization and Usage → Host Environment (Visible Range)](initialization-and-usage.md#host-environment-visible-range)** for the full visible-range flow.

---

## Inputs — `.input` and `getInputsMeta()`

### Reading and writing values

`.input` is a title-keyed Proxy. Keys are the **`title`** argument of each `input.*(...)` call in the Pine source. The container itself is frozen — you can mutate values per key, but you can't replace the whole object.

```javascript
const code = `
//@version=6
indicator("Demo")
length = input.int(14, "Length", minval=2, maxval=200)
src    = input.source(close, "Source")
maType = input.string("EMA", "MA Type", options=["EMA", "SMA", "WMA"])
plot(close)
`;
const ind = new Indicator(code);

ind.input['Length']; // → 14         (default from source)
ind.input['Source']; // → "close"
ind.input['MA Type']; // → "EMA"

ind.input['Length'] = 50; // ✓ valid override
ind.input['Length']; // → 50
```

When you pass the Indicator to `pine.run()`, the override flows into the runtime:

```javascript
const code = `
//@version=6
indicator("E2E")
len = input.int(14, "Length")
plot(ta.sma(close, len))
`;
const ind = new Indicator(code);
ind.input['Length'] = 5;
const ctx = await pine.run(ind);
// ctx.inputs.Length === 5
// the SMA in the script was computed with length=5
```

### Validation

Writes are validated against the input's schema. Failures throw immediately with a tailored message:

```javascript
ind.input['Unknown'] = 1; // ✗ Error: [Indicator.input] unknown input title "Unknown". Known: Length, Source, MA Type
ind.input['Length'] = 1; // ✗ Error: [Indicator.input] "Length" value 1 is below minval 2
ind.input['MA Type'] = 'HMA'; // ✗ Error: [Indicator.input] "MA Type" value "HMA" is not one of: "EMA", "SMA", "WMA"
ind.input = { foo: 1 }; // ✗ Error: [Indicator.input] .input cannot be replaced — mutate individual keys (…)
```

### Schema introspection — `getInputsMeta()`

Returns the parsed schema as an array of `IPineInput`. Useful for UI builders that need to render input controls.

```javascript
const meta = ind.getInputsMeta();
// [
//   { type: 'int',    title: 'Length',  defval: 14,    minval: 2, maxval: 200 },
//   { type: 'source', title: 'Source',  defval: 'close' },
//   { type: 'string', title: 'MA Type', defval: 'EMA', options: ['EMA','SMA','WMA'] },
// ]
```

Each entry carries everything the scanner harvested — `type`, `defval`, `title`, `tooltip`, `group`, `inline`, `display`, `options`, `minval`, `maxval`, `step`, `active`, `confirm`. The exported types `IPineInput`, `PineInputType`, and `PineInputDisplay` describe the shape.

---

## Declaration props — `.prop` and `getPropsMeta()`

The script's `indicator(...)` or `strategy(...)` declaration takes its own set of arguments — `overlay`, `precision`, `initial_capital`, `pyramiding`, `currency`, etc. The `.prop` view exposes those for read/override, mirroring the `.input` API but keyed by **arg name** instead of title.

### Reading source-code defaults

When you construct an Indicator, the source's declaration call is parsed and its arg values seed `.prop`. Spec defaults from the Pine docs apply to args the source didn't set.

```javascript
const code = `
//@version=6
strategy("Demo Strat", overlay=true, initial_capital=50000, pyramiding=3,
         currency=currency.EUR, default_qty_type=strategy.percent_of_equity,
         commission_type=strategy.commission.cash_per_order)
plot(close)
`;
const ind = new Indicator(code);

ind.prop['overlay']; // → true         (from source)
ind.prop['initial_capital']; // → 50000        (from source)
ind.prop['pyramiding']; // → 3            (from source)
ind.prop['currency']; // → "EUR"        (enum resolved to runtime string)
ind.prop['default_qty_type']; // → "percent_of_equity"
ind.prop['commission_type']; // → "cash_per_order"  (nested namespace resolved)
ind.prop['slippage']; // → 0            (spec default — source didn't set it)
```

Namespaced enum constants (`currency.EUR`, `strategy.percent_of_equity`, `strategy.commission.cash_per_order`) are resolved to the bare runtime string — matching what TradingView's `str.tostring()` would print.

### Writing overrides

```javascript
ind.prop['initial_capital'] = 75000;
ind.prop['pyramiding'] = 4;

const ctx = await pine.run(ind);
// ctx.strategy.config.initial_capital === 75000   (override wins)
// ctx.strategy.config.pyramiding      === 4
// ctx.strategy.config.currency        === "EUR"   (source-only value still applies)
```

Indicator scripts work the same way against `ctx.indicator`:

```javascript
const code = `//@version=6\nindicator("E2E", overlay=false, precision=2)\nplot(close)`;
const ind = new Indicator(code);
ind.prop['overlay'] = true;
ind.prop['precision'] = 6;
const ctx = await pine.run(ind);
// ctx.indicator.overlay   === true
// ctx.indicator.precision === 6
```

### Validation

Same strictness as `.input`:

```javascript
ind.prop['nope'] = 1; // ✗ Error: [Indicator.prop] unknown key "nope". Known: …
ind.prop['currency'] = 'XYZ'; // ✗ Error: [Indicator.prop] "currency" value "XYZ" is not one of: …
ind.prop['title'] = 'X'; // ✗ Error: [Indicator.prop] unknown key "title". Known: …   (title is mutable: false)
ind.prop = { foo: 1 }; // ✗ Error: [Indicator] .prop cannot be replaced — (…)
```

### Schema introspection — `getPropsMeta()`

Returns an `IPineProp[]` filtered to props applicable to the detected script type (`indicator` vs `strategy`). Includes `title` and `shorttitle` with `mutable: false` so UI builders can render them even though they're not writable.

```javascript
const ind = new Indicator(`//@version=6\nstrategy("X")\nplot(close)`);
const meta = ind.getPropsMeta();
// Each entry: { name, type, defval, options?, minval?, maxval?, mutable, appliesTo, version? }

const currency = meta.find((m) => m.name === 'currency');
// {
//   name: "currency",
//   type: "enum",
//   defval: "USD",
//   options: ["AED", "ARS", "AUD", ..., "USDT", ..., "ZAR"],
//   mutable: true,
//   appliesTo: "strategy",
// }
```

`getDeclarationType()` reports which schema the Indicator is using:

```javascript
new Indicator(`//@version=6\nstrategy("X")\nplot(close)`).getDeclarationType(); // → 'strategy'
new Indicator(`//@version=6\nindicator("X")\nplot(close)`).getDeclarationType(); // → 'indicator'
new Indicator(`//@version=6\nplot(close)`).getDeclarationType(); // → null  (falls back to indicator schema)
```

### Exported schemas for UI builders

The complete prop schemas are also exported as top-level constants. UI code that wants the full list (independent of any Indicator instance) can import them directly:

```javascript
const { INDICATOR_PROPS, STRATEGY_PROPS, propsForDeclaration } = require('pinets');

INDICATOR_PROPS; // IPineProp[]   — 17 entries (incl. title/shorttitle)
STRATEGY_PROPS; // IPineProp[]   — 33 entries
propsForDeclaration('strategy'); // → STRATEGY_PROPS
propsForDeclaration(null); // → INDICATOR_PROPS (fallback)
```

Every enum-typed entry in [`propsSchema.ts`](https://github.com/LuxAlgo/PineTS/blob/main/src/Indicator/propsSchema.ts) has a one-line comment enumerating accepted values and pointing to the corresponding exported Pine enum (`enum format`, `enum scale`, `enum currency`, …) in [`src/namespaces/Types.ts`](https://github.com/LuxAlgo/PineTS/blob/main/src/namespaces/Types.ts) so you can import the source-of-truth values rather than hard-coding strings in UI code.

---

## Reusing the same Indicator across runs

The transpiled function is cached on the Indicator instance, so passing the same Indicator to multiple `pine.run()` calls compiles the script **once**. Live overrides on `.input` / `.prop` between runs are picked up automatically.

```javascript
const code = `
//@version=6
indicator("Reusable")
len = input.int(14, "Length")
plot(ta.sma(close, len))
`;
const ind = new Indicator(code);
ind.input['Length'] = 7;

const ctxA = await new PineTS(dataA).run(ind); // first run: transpiles + scans
const ctxB = await new PineTS(dataB).run(ind); // second run: reuses prepared artifact
// Both runs computed ta.sma(close, 7)
```

This matters for hosts that run the same script across many datasets (e.g. a chart with multiple symbols, or a backtest sweep over parameter ranges).

---

## JS-function source

When the source is a JS callback, the AST scan for inputs returns `[]` (Pine inputs are written in Pine syntax; the JS form expresses them differently). The `.input` view is empty and writes throw "unknown title". The legacy `inputs` constructor map still works for runtime overrides via the JS path.

```javascript
const fn = ($) => {
    const { indicator, plot } = $.pine;
    indicator('JS', { overlay: true, precision: 4 });
    plot($.data.close);
};
const ind = new Indicator(fn);

ind.getInputsMeta(); // → []
ind.getDeclarationType(); // → 'indicator'    (acorn parse of the function body)
ind.prop['overlay']; // → true           (from the JS call)
ind.prop['precision']; // → 4              (from the JS call)
```

Declaration detection works for the JS path because the function body is parsed with `acorn`; the scanner walks for `CallExpression(indicator | strategy, ...)` regardless of whether it's destructured from `$.pine` first.

---

## Backward compatibility — constructor `inputs` map

The legacy second constructor argument (a title-keyed override map) is still honored. It's most useful when you build an Indicator and want to ship a default override set up front, without touching `.input` later.

```javascript
const code = `
//@version=6
indicator("BC")
len = input.int(14, "Length")
plot(ta.sma(close, len))
`;
const ind = new Indicator(code, { Length: 21 });
const ctx = await pine.run(ind);
// ctx.inputs.Length === 21
```

Precedence rule when both are set: `.input` overrides win over the constructor map. The constructor map is the baseline; `.input` writes layer on top.

```javascript
const ind = new Indicator(code, { Length: 21 });
ind.input['Length'] = 3;
const ctx = await pine.run(ind);
// ctx.inputs.Length === 3   ← .input wins
```

New code should prefer the `.input` API. The constructor `inputs` argument stays for callers that have existing code relying on it.

---

## Related

- **[Initialization and Usage](initialization-and-usage.md)** — full surface of `pine.run()`, `pine.stream()`, `pine.update()`.
- **[Strategy Namespace](strategy.md)** — `strategy.*` API surface (the Pine side of strategy props).
- **[API Coverage](api-coverage.md)** — implementation status of every Pine `input.*` and namespace.
