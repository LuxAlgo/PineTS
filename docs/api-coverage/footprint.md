---
layout: default
title: Footprint
parent: API Coverage
---

## Footprint

Volume footprint objects come from [`request.footprint()`](request.html). Every `footprint.*()` and `volume_row.*()` function also works in method form (`fp.poc()`, `row.delta()`), and both types can be used in declarations (`footprint fp = na`, `volume_row r = …`), as UDT fields, as collection elements (`array<volume_row>`, `map<int, volume_row>`, `matrix<volume_row>`) and as history (`fp[1]`). As on TradingView there is no `footprint(x)` / `volume_row(x)` cast function (unlike `line(x)`); declare a typed `na` instead.

### footprint

| Function                        | Status | Description                                                    |
| ------------------------------- | ------ | -------------------------------------------------------------- |
| `footprint.buy_volume()`        | ✅     | Total "buy" volume of the bar                                  |
| `footprint.sell_volume()`       | ✅     | Total "sell" volume of the bar                                 |
| `footprint.total_volume()`      | ✅     | Buy + sell volume of the bar                                   |
| `footprint.delta()`             | ✅     | Buy − sell volume of the bar                                   |
| `footprint.poc()`               | ✅     | Point of Control row (highest total volume; ties → the row closest to the footprint's middle, the lower one when equidistant) |
| `footprint.vah()`               | ✅     | Highest row of the value area                                  |
| `footprint.val()`               | ✅     | Lowest row of the value area                                   |
| `footprint.rows()`              | ✅     | New `array<volume_row>` of all rows, lowest first              |
| `footprint.get_row_by_price()`  | ✅     | Row whose `[down_price, up_price)` contains the price, else na |

### volume_row

| Function                          | Status | Description                                              |
| --------------------------------- | ------ | -------------------------------------------------------- |
| `volume_row.up_price()`           | ✅     | Upper price boundary of the row                          |
| `volume_row.down_price()`         | ✅     | Lower price boundary of the row                          |
| `volume_row.buy_volume()`         | ✅     | "Buy" volume of the row                                  |
| `volume_row.sell_volume()`        | ✅     | "Sell" volume of the row                                 |
| `volume_row.total_volume()`       | ✅     | Buy + sell volume of the row                             |
| `volume_row.delta()`              | ✅     | Buy − sell volume of the row                             |
| `volume_row.has_buy_imbalance()`  | ✅     | Buy volume ≥ ratio × sell volume of the row **below**    |
| `volume_row.has_sell_imbalance()` | ✅     | Sell volume ≥ ratio × buy volume of the row **above**    |

### Notes

- **Rows** are `ticks_per_row × syminfo.mintick` high, anchored at price 0 (so every bar shares one grid), and contiguous over the candle's whole `low..high` range (plus any level the source reports outside it) — a row with no trades inside that span exists with zero volume. The top row is the one whose upper edge reaches `high`: a high sitting exactly on a grid line closes the row below it. This is how TradingView's footprint lays out its rows.
- **Value area** starts at the POC and repeatedly considers the row just above and the row just below the area, taking the one with the larger total volume (a tie goes to the row closer to the POC, then to the upper row). A row that would carry the area past `va_percent` (default 70) of the bar's volume is refused and ends the area — so the value area holds *at most* the requested share (the POC row is always included, even alone). As on TradingView, a row landing less than 0.01 volume units over the target still counts as fitting. `vah()` / `val()` return the boundary rows; use `up_price()` / `down_price()` on them for the price levels. Verified row-for-row against TradingView's `request.footprint()` output (see `tests/namespaces/request-footprint-tv.test.ts`).
- **Imbalances** are diagonal, as on the volume footprint chart: a row has a buy imbalance when its buy volume is at least `imbalance_percent / 100` (default 3×) times the sell volume of the row below it, and a sell imbalance when its sell volume is at least that multiple of the buy volume of the row above. A percentage below 100 acts as 100 (the side must at least match its neighbour) and `na` flags no row. A row with no volume on the tested side never flags; the lowest row has no buy imbalance and the highest row no sell imbalance.
- **An `na` id is a runtime error**, as on TradingView: `footprint.delta(fp)` / `fp.delta()` on an `na` footprint stops the script with ``The `footprint` ID used in the `delta()` call cannot be `na`.`` (likewise for `volume_row`, e.g. the `na` that `get_row_by_price()` returns outside the footprint). Guard with `not na(fp)` on bars without footprint data.
- **Arguments** (`request.footprint()`): a negative `ticks_per_row`, `va_percent` or `imbalance_percent` is a runtime error (`Invalid value of the 'va_percent' argument (-10) in the 'request.footprint' function. It must be >= 0.`); `ticks_per_row` of 0 or `na` returns `na`; `va_percent` above 100 acts as 100 and `na` reduces the value area to the POC row. A footprint that would need more than **2000 rows** is `na`.
- **One footprint per script**: calls must all request the same footprint (same argument values); a second, different one stops the script with ``The script executes too many `request.footprint()` function calls.``. TradingView also rejects some calls PineTS lets through — identical arguments written in different scopes, or a second call that never executes.
- **Buy/sell attribution is the data source's** — PineTS sums whatever the provider classified (aggressor side for trade-level feeds).
