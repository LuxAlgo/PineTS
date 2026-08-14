---
layout: default
title: Strategy Namespace
nav_order: 9
permalink: /strategy/
---

# Strategy Namespace

PineTS implements Pine Script's full `strategy.*` surface so you can run TradingView strategies — entries, exits, position management, performance metrics — locally against your own data.

This page is the developer reference. For the surface checklist (every `strategy.*` entry mapped to its implementation status) see the **[Strategy API coverage page](api-coverage/strategy.md)**.

Every example below is exercised by a verification harness at `PineTS/.scratchpad/strategy-doc-examples.cjs` (kept in lock-step with the docs during authoring). If something doesn't behave as documented, the harness fails.

## Table of Contents

- [Quickstart](#quickstart)
- [The `strategy()` declaration](#the-strategy-declaration)
- [Order primitives](#order-primitives)
  - [`strategy.order()`](#strategyorder)
  - [`strategy.entry()`](#strategyentry)
  - [`strategy.exit()`](#strategyexit)
  - [`strategy.close()` / `close_all()`](#strategyclose--close_all)
  - [`strategy.cancel()` / `cancel_all()`](#strategycancel--cancel_all)
- [The `context.strategy` object](#the-contextstrategy-object)
- [Trade collections](#trade-collections)
- [Read-only getters](#read-only-getters)
- [Risk-adjusted performance (Sharpe / Sortino)](#risk-adjusted-performance-sharpe--sortino)
- [Compound annual growth rate (CAGR)](#compound-annual-growth-rate-cagr)
- [Benchmark - Buy-and-hold return](#benchmark---buy-and-hold-return)
- [Constants](#constants)
- [Risk management](#risk-management)
- [Conversion helpers](#conversion-helpers)
- [Known divergences](#known-divergences)

---

## Quickstart

```javascript
const { PineTS } = require('pinets');

const data = [/* …OHLCV bars… */];
const pine = new PineTS(data);

const ctx = await pine.run(($) => {
    const { strategy } = $.pine;

    // 1. Declare the strategy ONCE per run.
    strategy('My Long-Only', {
        overlay: true,
        initial_capital: 100000,
        default_qty_type: 'percent_of_equity',
        default_qty_value: 10,
    });

    // 2. Place orders based on bar conditions.
    //    Always wrap bodies in { ... } — see the brace quirk below.
    if ($.idx === 1) {
        strategy.entry('long', strategy.long, 1);
    }
    if ($.idx === 10) {
        strategy.close('long');
    }
});

// 3. Inspect the final state.
const s = ctx.strategy;
console.log('Net profit:', s.netprofit);
console.log('Closed trades:', s.closedtrades.length);
console.log('First trade profit:', s.closedtrades[0].profit);
```

The same script in native Pine syntax also works — pass the source to `run()`:

```javascript
const code = `
//@version=5
strategy("My Long-Only", overlay=true, initial_capital=100000,
         default_qty_type=strategy.percent_of_equity, default_qty_value=10)
if bar_index == 1
    strategy.entry("long", strategy.long, 1)
if bar_index == 10
    strategy.close("long")
`;

// (a) Bare string — simplest form.
const ctx = await pine.run(code);

// (b) Wrapped in Indicator() — required when you need to override input.* values
//     at runtime (the keys must match each input's title argument).
const { Indicator } = require('pinets');
const ctx2 = await pine.run(new Indicator(code));                    // no overrides
const ctx3 = await pine.run(new Indicator(code, { Qty: 5 }));        // override input.int(1, "Qty")
```

The `Indicator()` wrapper is the same one used for indicator scripts — strategies and indicators share the runtime, so there's nothing strategy-specific to do. See **[Indicator](indicator.md)** for the full API (per-key overrides via `ind.input[...]` / `ind.prop[...]`, schema introspection, etc.), or **[Initialization and Usage → Running with Runtime Inputs](initialization-and-usage.md#running-with-runtime-inputs)** for a quick overview.

---

## The `strategy()` declaration

A single `strategy(title, options)` call initializes the strategy state on `context.strategy`. It's safe to call on every bar — only the first call initializes; subsequent calls update `config` only. Field names mirror Pine's `strategy()` parameters exactly.

```javascript
await pine.run(($) => {
    const { strategy } = $.pine;
    strategy('My Strategy', {
        overlay: true,
        initial_capital: 50000,
        default_qty_type: 'percent_of_equity',  // 'fixed' | 'percent_of_equity' | 'cash'
        default_qty_value: 25,
        commission_type:  'percent',            // 'percent' | 'cash_per_order' | 'cash_per_contract'
        commission_value: 0.075,
        slippage: 2,                            // in ticks of syminfo.mintick
        pyramiding: 3,
    });
});
```

After the call, `context.strategy.config` holds the merged options (defaults + your overrides) and the rest of `context.strategy` is initialized — see the [object reference below](#the-contextstrategy-object).

**Supported options** (every field is `StrategyConfig` in [`PineTS/src/namespaces/strategy/types.ts`](https://github.com/LuxAlgo/PineTS/blob/main/src/namespaces/strategy/types.ts)):

| Field | Type | Default | Notes |
|---|---|---|---|
| `title` | `string` | `''` | First positional arg |
| `overlay` | `boolean` | `false` | |
| `initial_capital` | `number` | `1000000` | |
| `currency` | `string` | `'USD'` | |
| `pyramiding` | `number` | `1` | Cap on same-direction open trades |
| `default_qty_type` | `string` | `'fixed'` | Qty unit for unspecified `entry()` qty |
| `default_qty_value` | `number` | `1` | |
| `commission_type` | `string` | `'percent'` | |
| `commission_value` | `number` | `0` | |
| `slippage` | `number` | `0` | Ticks against trade direction |
| `margin_long` / `margin_short` | `number` | `100` | Margin % (used by `margin_liquidation_price`) |
| `risk_free_rate` | `number` | `2` | Annual %, denominator input for [Sharpe / Sortino](#risk-adjusted-performance-sharpe--sortino) |
| `process_orders_on_close` | `boolean` | `false` | Affects `strategy.close({immediately: true})` |
| `max_lines_count` / `max_labels_count` / `max_boxes_count` / `max_polylines_count` | `number` | `50` | Pass-through to drawing engine |

---

## Order primitives

PineTS implements the same order lifecycle as TradingView:

1. **You place an order on bar N** — it goes onto `state.pending_orders`.
2. **On bar N+1's open, the engine processes it** — fills it if market, or checks limit/stop conditions. Slippage and commissions are applied at fill time.
3. **Position-mutating events** (open / close / reverse) are mirrored on the flat scalars (`position_size`, `position_avg_price`, `position_entry_name`).

Internal lifecycle is handled by `processStrategyOrders()` and `processExitOrders()` in [`strategy/utils.ts`](https://github.com/LuxAlgo/PineTS/blob/main/src/namespaces/strategy/utils.ts), invoked at the start of every bar.

### `strategy.order()`

The lowest-level primitive — no pyramiding cap, no auto-reverse, no risk filters. Use when you need exact control.

```javascript
await pine.run(($) => {
    const { strategy } = $.pine;
    strategy('Order Test', { overlay: true, initial_capital: 10000 });
    if ($.idx === 1) {
        // Pine: strategy.order(id, direction, qty, limit?, stop?, ...)
        strategy.order('long1', strategy.long, 1);
    }
});
```

After this run, `context.strategy.opentrades[0]` is `{ entry_id: 'long1', size: 1, entry_price: <bar-2 open>, ... }`.

### `strategy.entry()`

Same shape as `order()`, but adds two behaviors:

- **Pyramiding cap** — if the `strategy()` declaration sets `pyramiding: N`, additional same-direction entries become no-ops once `N` trades are open in that direction.
- **Auto-reversal** — entering opposite the current position closes the existing position and opens the new one in a single market order. The pending order's qty is automatically inflated to `|current position| + requested qty`.

```javascript
// Pyramiding cap
strategy('Pyramid', { pyramiding: 2 });
if ($.idx === 1)  { strategy.entry('L1', strategy.long, 1); }
if ($.idx === 5)  { strategy.entry('L2', strategy.long, 1); }
if ($.idx === 10) { strategy.entry('L3', strategy.long, 1); }  // no-op once L1+L2 are open

// Auto-reversal
if ($.idx === 1) { strategy.entry('go-long',  strategy.long,  1); }
if ($.idx === 5) { strategy.entry('go-short', strategy.short, 1); }
// after bar 5+1: closedtrades=[go-long], opentrades=[go-short], position_size=-1
```

### `strategy.exit()`

Attaches conditional exit orders (TP / SL / trailing stop) to an existing entry. Multiple legs on a single `exit()` call are treated OCO — the first to trigger fires and removes the rest.

```javascript
if ($.idx === 1) {
    strategy.entry('long', strategy.long, 1);
    strategy.exit('tp/sl', {
        from_entry: 'long',      // empty/undefined = attach to ALL open entries
        profit: 10000,           // TP in TICKS of syminfo.mintick
        loss: 5000,              // SL in TICKS
        // or absolute prices:
        // limit: 120,           // TP price level
        // stop:  90,            // SL price level
        // trailing:
        // trail_price: 110,     // arm trailing once price hits this absolute level
        // trail_points: 500,    // OR arm once price moves N ticks above entry
        // trail_offset: 200,    // ride N ticks behind the running peak
    });
}
```

Trigger evaluation runs each bar against the bar's intra-bar high/low (not close), matching TV's "tick-fast" semantics — a TP/SL can fire mid-bar even if the close doesn't reach the level.

### `strategy.close()` / `close_all()`

`close(id)` flattens any position opened by the entry-id `id` (FIFO across multiple trades sharing the id). `close_all()` flattens **all** open trades regardless of id.

```javascript
if ($.idx === 1) {
    strategy.entry('A', strategy.long, 1);
    strategy.entry('B', strategy.long, 1);
}
if ($.idx === 5) { strategy.close('A'); }
// after: closedtrades=[A], opentrades=[B]

// or
if ($.idx === 5) { strategy.close_all(); }
// after: closedtrades=[A, B], opentrades=[]
```

Both accept an `immediately: true` option that requires `process_orders_on_close: true` in the declaration and fills at the **current** bar's close instead of the next bar's open.

### `strategy.cancel()` / `cancel_all()`

Removes pending orders. `cancel(id)` drops orders whose `id` matches; `cancel_all()` empties `pending_orders`. Already-filled trades are unaffected.

```javascript
if ($.idx === 1) {
    strategy.entry('lim', strategy.long, 1, /*limit=*/ 1);  // limit far below market → never fills
    strategy.cancel('lim');                                 // remove it
}
```

---

## The `context.strategy` object

After `strategy()` is declared, `context.strategy` exposes the live state — the same object every getter reads from. It's documented in [`StrategyState`](https://github.com/LuxAlgo/PineTS/blob/main/src/namespaces/strategy/types.ts):

```typescript
interface StrategyState {
    config: StrategyConfig;             // merged declaration options

    // Trade collections (arrays, indexable, .length = Pine's count)
    opentrades:     Trade[];
    closedtrades:   Trade[];
    pending_orders: Order[];

    // Position info — FLAT scalars matching Pine's data model
    position_size:        number;       // SIGNED — positive long, negative short
    position_avg_price:   number;       // NaN when flat
    position_entry_name:  string;       // entry_id that opened the current position

    // Account / aggregate P&L
    initial_capital:  number;
    account_currency: string;
    equity:           number;
    netprofit:        number;           // realized only
    grossprofit:      number;
    grossloss:        number;
    openprofit:       number;           // unrealized P&L of open positions

    // Peaks
    max_drawdown:     number;
    max_runup:        number;
    equity_peak:      number;           // internal high-water mark
    equity_trough:    number;

    // Risk-adjusted performance — computed ONCE at end-of-run from the
    // monthly equity curve (report-only; see the section below). These are
    // NOT Pine built-in variables, so they're read off context.strategy only.
    sharpe_ratio:     number;
    sortino_ratio:    number;

    // Capital efficiency
    cagr:             number;           // annualized return %, report-only (NaN if window < 1 day)

    // Buy-and-hold benchmark — report-only, computed ONCE at end-of-run.
    // Models a long position bought with the entire initial capital at the
    // first trade's (slippage-adjusted) entry price and held to the last bar.
    buy_and_hold_pnl:        number;    // initial_capital × per_gain / 100
    buy_and_hold_per_gain:   number;    // (last_close − first_entry) / first_entry × 100
    strategy_outperformance: number;    // netprofit − buy_and_hold_pnl

    // Trade-stat counters
    wintrades:                number;
    losstrades:               number;
    eventrades:               number;
    wintrades_total_profit:   number;
    losstrades_total_loss:    number;

    // Position-size peaks
    max_contracts_held_all:   number;
    max_contracts_held_long:  number;
    max_contracts_held_short: number;

    // Risk rules + halt flag (set by strategy.risk.*)
    risk_rules: { /* see Risk Management */ };
    risk_halted: boolean;
}
```

Each `Trade` (in `opentrades` / `closedtrades`):

```typescript
interface Trade {
    id:               string;           // internal unique id
    entry_id:         string;           // id passed to strategy.entry()
    entry_price:      number;
    entry_bar_index:  number;
    entry_time:       number;           // ms timestamp
    entry_comment?:   string;
    exit_id?:         string;           // set on close
    exit_price?:      number;
    exit_bar_index?:  number;
    exit_time?:       number;
    exit_comment?:    string;
    size:             number;           // SIGNED — positive long, negative short
    profit?:          number;           // realized P&L on close (commission-netted)
    commission?:      number;           // total commission charged on this trade
    max_drawdown?:    number;           // per-trade peak adverse excursion (in dollars)
    max_runup?:       number;           // per-trade peak favorable excursion
    status:           'open' | 'closed';
}
```

Each `Order` (in `pending_orders`):

```typescript
interface Order {
    id:         string;
    direction:  number;                  // +1 long, -1 short
    qty:        number;                  // unsigned
    type:       'market' | 'limit' | 'stop' | 'stop-limit';
    limit?:     number;
    stop?:      number;
    bar:        number;                  // bar index where the order was placed
    time:       number;                  // ms timestamp at placement
    category?:  'entry' | 'exit';        // 'exit' for TP/SL/trailing orders
    status:     'pending' | 'filled' | 'cancelled';
    fill_price?: number;
    fill_bar?:   number;
    fill_time?:  number;

    // Exit-specific fields (when category === 'exit')
    profit?:        number;              // TP in ticks
    loss?:          number;              // SL in ticks
    trail_price?:   number;
    trail_offset?:  number;
    trail_points?:  number;
    from_entry?:    string;              // '' = all open entries
    qty_percent?:   number;
    // ... comments + alert texts per leg
    oca_name?:      string;
    oca_type?:      'cancel' | 'reduce' | 'none';
}
```

---

## Trade collections

`strategy.closedtrades` and `strategy.opentrades` serve a dual role in Pine — both as a count (series int) and as a namespace for per-trade getters (`profit(idx)`, `entry_price(idx)`, etc.). PineTS preserves both.

**From inside the run callback (or in Pine syntax)** — the transpiler auto-calls the namespace, so you can write Pine-style code:

```javascript
await pine.run(($) => {
    const { strategy, plot } = $.pine;
    strategy('Getter Test', { overlay: true, initial_capital: 100000 });
    if ($.idx === 1) { strategy.entry('e1', strategy.long, 1); }
    if ($.idx === 5) { strategy.close('e1'); }

    // Used as a count (auto-coerces to int via valueOf):
    plot(strategy.closedtrades);

    // Used as a namespace (per-trade getter):
    // const lastProfit = strategy.closedtrades.profit(0);
});
```

**From plain JS code outside the callback** (and on the returned context), it's an array — use index access:

```javascript
const ctx = await pine.run(/* ... */);
const s = ctx.strategy;

console.log('Closed count:', s.closedtrades.length);
console.log('First profit:', s.closedtrades[0].profit);
console.log('First trade size:', s.closedtrades[0].size);     // signed
console.log('First trade was a win:', s.closedtrades[0].profit > 0);
```

Per-trade getter methods (`profit(idx)`, `size(idx)`, `entry_price(idx)`, `max_drawdown_percent(idx)`, etc.) are listed in the [API coverage table](api-coverage/strategy.md#closed-trades).

---

## Read-only getters

Every Pine `strategy.*` scalar getter is implemented as a property on the `strategy` namespace inside the run callback, and is also available as a field on `context.strategy` after the run:

| Getter | Source |
|---|---|
| `strategy.equity` | `state.equity` (initial + realized + unrealized) |
| `strategy.netprofit` / `netprofit_percent` | `state.netprofit` (realized only) |
| `strategy.openprofit` / `openprofit_percent` | `state.openprofit` (unrealized) |
| `strategy.grossprofit` / `grossprofit_percent` | `state.grossprofit` |
| `strategy.grossloss` / `grossloss_percent` | `state.grossloss` |
| `strategy.position_size` | signed; positive long, negative short |
| `strategy.position_avg_price` | NaN when flat |
| `strategy.position_entry_name` | entry id that opened current position |
| `strategy.wintrades` / `losstrades` / `eventrades` | trade outcome counters |
| `strategy.avg_trade` / `avg_winning_trade` / `avg_losing_trade` (+ `_percent`) | derived averages |
| `strategy.max_drawdown` / `max_drawdown_percent` | equity-curve trough |
| `strategy.max_runup` / `max_runup_percent` | equity-curve peak above start |
| `strategy.max_contracts_held_all` / `_long` / `_short` | running peaks |
| `strategy.initial_capital` / `account_currency` | from declaration |
| `strategy.margin_liquidation_price` | computed from position + margin |

After a run, the same values are on `context.strategy` (the names are 1:1):

```javascript
const ctx = await pine.run(/* ... */);
const s = ctx.strategy;

console.log('Equity:', s.equity);
console.log('Net profit:', s.netprofit);
console.log('Win rate:', s.wintrades / s.closedtrades.length);
console.log('Max drawdown:', s.max_drawdown);
console.log('Max contracts held (long):', s.max_contracts_held_long);
```

---

## Risk-adjusted performance (Sharpe / Sortino)

PineTS reports the two risk-adjusted ratios from TradingView's **Risk-adjusted performance** panel:

```javascript
const ctx = await pine.run(/* ... */);
const s = ctx.strategy;

console.log('Sharpe ratio:',  s.sharpe_ratio);
console.log('Sortino ratio:', s.sortino_ratio);
```

**These are report-only fields, not getters.** Unlike `netprofit` or `max_drawdown`, Sharpe and Sortino are **not** Pine built-in variables — TradingView surfaces them only in the Strategy Tester report (and xlsx export), never to scripts. So there is no `strategy.sharpe_ratio` accessor inside the run callback; the values live on `context.strategy` after the run and nowhere else.

They are computed **once at the end of the run** (in `finalizeStrategyRun`), from the strategy's monthly equity curve.

### How they're calculated

Matching TradingView's documented methodology:

1. **Sample equity monthly.** The mark-to-market `strategy.equity` is captured at the last bar of each calendar month.
2. **Monthly returns.** Simple returns `rᵢ = Eᵢ / Eᵢ₋₁ − 1`, anchored at `initial_capital` (the first return runs from initial capital to the first month-end).
3. **Risk-free rate.** `RFR = risk_free_rate / 100 / 12` — the annual `risk_free_rate` declaration option (default **2**, i.e. 2%) converted to a monthly figure.
4. **Ratios** (no annualization):

   ```
   Sharpe  = (mean(r) − RFR) / SD
   Sortino = (mean(r) − RFR) / DD

   SD = √( Σ (rᵢ − mean(r))² / N )           — population standard deviation
   DD = √( Σ min(0, rᵢ − RFR)²   / N )        — downside deviation over all N returns, target = RFR
   ```

Edge cases: with fewer than two monthly returns both ratios are `0`; a zero-variance (flat) curve yields Sharpe `0`; a curve with no downside (every return above the RFR) yields Sortino `0`.

Set the risk-free rate via the declaration:

```javascript
strategy('RFR example', { initial_capital: 100000, risk_free_rate: 4 });  // 4% annual
```

### Accuracy

The formula matches TradingView's exactly, but the ratios are **derivatives of the bar-by-bar equity curve** — so their fidelity rides on the engine's mark-to-market accuracy, not on the formula. Across the TV oracle datasets they land within roughly the second decimal (most within ~0.01; strategies with heavy margin-call activity diverge a little more, since their intra-month equity path is where PineTS and TV differ most even when final net profit matches). They are intended as a faithful summary metric, **not** a cent-exact reproduction like `netprofit`.

---

## Capital Efficiency - Compound annual growth rate (CAGR)

PineTS also reports the **annualized return (%)** of strategy equity over the whole backtest window:

```javascript
const ctx = await pine.run(/* ... */);
const s = ctx.strategy;

console.log('Strategy CAGR:', s.cagr, '%');
```

Like Sharpe / Sortino, `strategy.cagr` is a **report-only field, not a Pine built-in** — it lives on `context.strategy` after the run, computed once in `finalizeStrategyRun`.

### How it's calculated

Mirrors TradingView calculations:

```
daysBetween = (lastBarTime − firstBarTime) / 86_400_000   // ms per day
years       = daysBetween / 365
CAGR%       = 100 × ( (initial_capital + netprofit) / initial_capital ) ^ ((1 / years) − 1 )
```

`firstBarTime` / `lastBarTime` are the open times of the first and last loaded bars (matching Pine's `var int firstTime = time` and `last_bar_time`).

Edge cases: the result is `NaN` when the window is shorter than one day, when there is no loaded data, or when the capital figures are non-finite.

---

## Benchmark - Buy-and-hold return

PineTS reports how the strategy fared against simply **buying and holding** the instrument over the same window:

```javascript
const ctx = await pine.run(/* ... */);
const s = ctx.strategy;

console.log('Buy & hold P&L:',     s.buy_and_hold_pnl);        // currency
console.log('Buy & hold % gain:',  s.buy_and_hold_per_gain);   // percent
console.log('Outperformance:',     s.strategy_outperformance); // netprofit − buy&hold
```

Like CAGR / Sharpe / Sortino these are **report-only fields, not Pine built-ins** — computed once in `finalizeStrategyRun` and read off `context.strategy` after the run.

### How it's calculated

The benchmark models a single **long** position bought with the **entire initial capital** at the **first trade's entry price** and held open through the last bar — it is never sold:

```
price_start   = first trade's entry price   // slippage already applied at fill
price_end     = last bar's close
qty           = initial_capital / price_start
buy_and_hold_pnl        = qty × (price_end − price_start)
                        = initial_capital × (price_end − price_start) / price_start
buy_and_hold_per_gain   = (price_end − price_start) / price_start × 100
strategy_outperformance = netprofit − buy_and_hold_pnl
```

Because the anchor is the first trade's actual fill price, the benchmark **is affected by the `slippage` property** (slippage shifts that fill). Since the position is never closed, there is **no exit leg**: commissions never apply and `price_end` carries no slippage. The figures are `NaN` until the first trade opens.

---

## Constants

PineTS exposes Pine's three sets of `strategy` constants. Inside the run callback they appear as bare strings; from plain JS you call them as factories.

**Top-level constants** (resolve to themselves — the engine accepts these names verbatim):

```javascript
strategy.long              === 'long'
strategy.short             === 'short'
strategy.cash              === 'cash'
strategy.fixed             === 'fixed'
strategy.percent_of_equity === 'percent_of_equity'
```

**Nested constant namespaces** — the transpiler auto-calls them inside the run callback. From plain JS, you call the namespace yourself:

```javascript
// Inside run callback (Pine-style):
strategy.direction.long    // 'long'
strategy.oca.cancel        // 'cancel'
strategy.commission.percent  // 'percent'

// From plain JS:
const dir = strategy.direction();   // { long: 'long', short: 'short', all: 'all' }
const oca = strategy.oca();         // { none: 'none', cancel: 'cancel', reduce: 'reduce' }
const com = strategy.commission();  // { percent: 'percent', cash_per_order: 'cash_per_order',
                                    //   cash_per_contract: 'cash_per_contract' }
```

---

## Risk management

`strategy.risk` is a nested namespace with 6 setter functions. Each one configures a pre-trade filter on `state.risk_rules`. Filters are checked by the engine before every fill; once a hard-stop rule triggers, `state.risk_halted` is set and further entries are blocked for the remainder of the run.

```javascript
await pine.run(($) => {
    const { strategy } = $.pine;
    strategy('Risk-Managed', { overlay: true, initial_capital: 100000 });
    if ($.idx === 0) {
        // Inside the run callback (Pine-style auto-call works too — strategy.risk.x()):
        const r = strategy.risk();
        r.allow_entry_in('long');           // 'long' | 'short' | 'all'
        r.max_position_size(5);             // cap contracts at 5
        r.max_drawdown(20000, 'cash');      // halt entries if equity drops $20k from peak
        r.max_intraday_loss(5000, 'cash');  // halt for the day if loss exceeds $5k
        r.max_intraday_filled_orders(10);   // halt for the day after 10 fills
        r.max_cons_loss_days(3);            // halt after 3 consecutive losing days
    }
});

// Inspect after the run:
const ctx = /* ... */;
console.log(ctx.strategy.risk_rules);
// { allow_entry_in: 'long', max_position_size: 5,
//   max_drawdown: { value: 20000, type: 'cash' }, ... }
console.log(ctx.strategy.risk_halted);  // true if any hard-stop fired
```

---

## Conversion helpers

Three utility functions for currency / qty math. In PineTS today the conversion functions are identity passthroughs for same-currency strategies (the engine doesn't currently fetch FX rates); `default_entry_qty` is fully functional and computes the qty a `strategy.entry()` would size given the current `default_qty_type` / `default_qty_value` and a hypothetical fill price.

```javascript
await pine.run(($) => {
    const { strategy } = $.pine;
    strategy('Conversion', { overlay: true, currency: 'USD',
                             default_qty_type: 'percent_of_equity', default_qty_value: 10 });

    const inUsd  = strategy.convert_to_account(100);  // 100 (passthrough for same-currency)
    const inSym  = strategy.convert_to_symbol(100);   // 100
    const qty    = strategy.default_entry_qty(50000); // (equity * 10%) / 50000
});
```

---

## Known divergences

The strategy namespace's surface is implemented 1:1 with TV. A subset of strategies produce values that diverge from TV in specific fields — these are tracked iteration items, **not** missing surface:

- **`strategy.margin_liquidation_price`** — PineTS uses an "equity hits zero" approximation; TV's broker liquidation formula differs.
- **`strategy.convert_to_account` / `convert_to_symbol`** — identity passthrough for same-currency cases. TV may return `na` when symbol/account currencies differ even nominally (e.g. `BTCUSDC`'s USDC vs USD).
- **OCA enforcement** — order objects carry `oca_name` / `oca_type` fields, but the engine doesn't yet auto-cancel or reduce siblings on fill. Deferred Phase 7.
- **Commission rounding** — per-leg charges may differ from TV by sub-cent rounding in edge cases.
- **Per-trade `max_drawdown` / `max_runup`** — PineTS tracks intra-bar high/low excursions, but TV's accounting differs for trades that open and close in adjacent bars.
- **`strategy.sharpe_ratio` / `strategy.sortino_ratio`** — the formula matches TV exactly, but the ratios are computed off the monthly equity curve and therefore inherit any bar-by-bar mark-to-market path difference. They match TV to ~2 decimals (most datasets within ~0.01), not to the cent. See [Risk-adjusted performance](#risk-adjusted-performance-sharpe--sortino).

For the complete checklist (every entry mapped to its implementation status) and the list of TV oracle scripts in use, see the **[Strategy API coverage page](api-coverage/strategy.md)**.
