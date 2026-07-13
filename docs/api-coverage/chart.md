---
layout: default
title: Chart
parent: API Coverage
---

## Chart

### Chart Properties

| Function         | Status | Description      |
| ---------------- | ------ | ---------------- |
| `chart.bg_color` | ✅     | Background color |
| `chart.fg_color` | ✅     | Foreground color |

### Chart Type Detection

| Function              | Status | Description                                        |
| --------------------- | ------ | -------------------------------------------------- |
| `chart.is_heikinashi` | ✅     | True on a Heikin Ashi chart (see note below)       |
| `chart.is_kagi`       | ⚠️     | Always `false` — chart type not representable      |
| `chart.is_linebreak`  | ⚠️     | Always `false` — chart type not representable      |
| `chart.is_pnf`        | ⚠️     | Always `false` — chart type not representable      |
| `chart.is_range`      | ⚠️     | Always `false` — chart type not representable      |
| `chart.is_renko`      | ⚠️     | Always `false` — chart type not representable      |
| `chart.is_standard`   | ✅     | True unless the chart is a non-standard type       |

### Visible Range

| Function                       | Status | Description            |
| ------------------------------ | ------ | ---------------------- |
| `chart.left_visible_bar_time`  | ✅     | Left visible bar time  |
| `chart.right_visible_bar_time` | ✅     | Right visible bar time |

### Chart Point

| Function                   | Status | Description             |
| -------------------------- | ------ | ----------------------- |
| `chart.point.copy()`       | ✅     | Copy chart point        |
| `chart.point.from_index()` | ✅     | Create point from index |
| `chart.point.from_time()`  | ✅     | Create point from time  |
| `chart.point.new()`        | ✅     | Create new chart point  |
| `chart.point.now()`        | ✅     | Get current chart point |

### Chart Point Fields

| Field                | Status | Description         |
| -------------------- | ------ | ------------------- |
| `chart.point.index`  | ✅     | Bar index of point  |
| `chart.point.price`  | ✅     | Price of point      |
| `chart.point.time`   | ✅     | Timestamp of point  |

### Notes

- **`is_heikinashi` / `is_standard` — THE CHART TYPE IS THE TICKER.** A host declares a Heikin Ashi chart by constructing PineTS with an **extended ticker**: `new PineTS(source, 'BTCUSDT;heikinashi', 'D', …)`. The chart type is derived from that ticker's `;heikinashi` modifier — there is no separate setting. On such a chart, `chart.is_heikinashi` is `true`, `chart.is_standard` is `false`, and `syminfo.tickerid` carries the modifier (so `request.security(syminfo.tickerid, …)` routes chart-typed data requests to the data source — see [Ticker](ticker.html)). **PineTS never transforms bars**: the data source of an extended ticker is expected to serve the chart-type view already (an embedding host that owns the transform, e.g. a charting library); PineTS' bundled providers strip the modifier and serve standard candles.
- **`is_kagi` / `is_renko` / `is_linebreak` / `is_pnf` / `is_range`** — these chart types have no data source that can construct their bars, so the predicates are hardcoded `false`.
- These predicates are Pine **variables** (bare member access, `chart.is_heikinashi` — no call), exposed as getters like the visible-range built-ins below.
- **`left_visible_bar_time` / `right_visible_bar_time`** — In TradingView these reflect the user's UI viewport (what's scrolled into view). PineTS is renderer-agnostic, so by default they fall back to the first/last bar of the loaded `marketData` (i.e. "the full loaded range is the viewport"). Hosts that render PineTS output and want to model a true zoom/pan can override via `PineTS.setVisibleRange(left, right)`. Use `PineTS.usesVisibleRange()` to skip viewport-change re-runs for indicators that don't reference these built-ins; `PineTS.update(code)` is a smart re-run helper that gates on this tag automatically.
