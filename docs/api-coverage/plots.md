---
layout: default
title: Plots
parent: API Coverage
---

## Plots

| Function       | Status | Description            |
| -------------- | ------ | ---------------------- |
| `plot()`       | ✅     | Plot a series          |
| `plotchar()`   | ✅     | Plot character markers |
| `plotarrow()`  | ✅     | Plot arrow markers     |
| `plotbar()`    | ✅     | Plot bar chart         |
| `plotcandle()` | ✅     | Plot candlestick chart |
| `plotshape()`  | ✅     | Plot shape markers     |
| `barcolor()`   | ✅     | Set bar color          |
| `bgcolor()`    | ✅     | Set background color   |
| `hline()`      | ✅     | Plot horizontal line   |
| `fill()`       | ✅     | Fill between two plots or hlines |

---

### Plot Title Collisions

When multiple `plot()` (or `hline()`) calls share the same `title`, PineTS disambiguates them by appending a `#N` suffix to the plot key. The first plot keeps the plain title, and subsequent collisions are numbered sequentially:

- First `plot(close, "SMA")` &rarr; plot key `"SMA"`
- Second `plot(open, "SMA")` &rarr; plot key `"SMA#1"`
- Third `plot(high, "SMA")` &rarr; plot key `"SMA#2"`

{: .warning }
Using duplicate plot titles is **not recommended**. The `#N` suffix ordering depends on execution order and may lead to fragile references. Always prefer unique titles for each plot. A more elegant solution for this case will be provided in a future version of PineTS.
