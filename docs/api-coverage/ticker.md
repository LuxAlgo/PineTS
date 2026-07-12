---
layout: default
title: Ticker
parent: API Coverage
---

## Ticker

### Ticker Functions

| Function               | Status | Description                  |
| ---------------------- | ------ | ---------------------------- |
| `ticker.heikinashi()`  | ✅     | Create Heikin Ashi ticker    |
| `ticker.inherit()`     | ✅     | Inherit ticker               |
| `ticker.kagi()`        | ✅     | Create Kagi ticker           |
| `ticker.linebreak()`   | ✅     | Create Line Break ticker     |
| `ticker.modify()`      | ✅     | Modify ticker                |
| `ticker.new()`         | ✅     | Create new ticker            |
| `ticker.pointfigure()` | ✅     | Create Point & Figure ticker |
| `ticker.renko()`       | ✅     | Create Renko ticker          |
| `ticker.standard()`    | ✅     | Create standard ticker       |

### Notes

#### Extended tickers — the chart-type modifier

Non-standard chart types travel **in the ticker id** as a `";modifier"` suffix (the *extended ticker*): `"BINANCE:BTCUSDT;heikinashi"`. This is PineTS' equivalent of TradingView's encoded chart-type ticker IDs, and it is the **single source of truth** for the chart type (see [Chart](chart.html)):

- **`ticker.heikinashi(sym)`** → `"sym;heikinashi"` (idempotent). Passed to `request.security`, the extended ticker rides through to the data source: a host data source that owns the Heikin Ashi transform serves derived bars; PineTS' **bundled providers strip the modifier** and serve standard candles (standalone no-op — PineTS never synthesises bars).
- **`ticker.standard(sym?)`** → strips any chart-type modifier. On a Heikin Ashi chart, `ticker.standard(syminfo.tickerid)` turns `"…;heikinashi"` back into the plain ticker, so the request fetches STANDARD candles (the opt-out).
- **`ticker.inherit(from, sym)`** → propagates the chart-type modifier from `from` onto `sym` (`inherit(syminfo.tickerid, "ETHUSDT")` on an HA chart → `"ETHUSDT;heikinashi"`). Other modifier kinds (session, adjustment) are dropped, as before.

#### Other notes

- **`inherit`, `new`, `modify`, `standard`** — return ticker-ID strings that match TradingView's output exactly for the common "no extra modifiers" case (the dominant real-world usage). When non-default `adjustment` / `backadjustment` / `settlement_as_close` values are passed, TV emits an encoded `={"adjustment":"…","symbol":"…"}` form; PineTS returns the plain `prefix:ticker` since the underlying providers don't honour those modifiers anyway. Documented in [`src/namespaces/Ticker.ts`](../../src/namespaces/Ticker.ts).
- **`renko`, `kagi`, `linebreak`, `pointfigure`** — accepted and chainable into `request.security` / `request.security_lower_tf` without errors, but they return the plain symbol rather than an encoded "alternative chart type" ticker ID. No data source we route to can construct those bars, so requests resolve to standard data. Use `chart.is_*` to detect this and branch in scripts that depend on actual Renko/Kagi bars.
