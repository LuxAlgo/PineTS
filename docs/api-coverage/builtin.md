---
layout: default
title: Builtin
parent: API Coverage
---

## Builtin

### Variables

| Function          | Status | Description                            |
| ----------------- | ------ | -------------------------------------- |
| `bar_index`       | ✅     | Current bar index                      |
| `close`           | ✅     | Close price                            |
| `high`            | ✅     | High price                             |
| `hl2`             | ✅     | Average of high and low                |
| `hlc3`            | ✅     | Average of high, low, and close        |
| `hlcc4`           | ✅     | Average of high, low, close, and close |
| `last_bar_index`  | ✅     | Index of last bar                      |
| `last_bar_time`   | ✅     | Time of last bar                       |
| `low`             | ✅     | Low price                              |
| `na`              | ✅     | Not a number (NaN)                     |
| `ohlc4`           | ✅     | Average of open, high, low, and close  |
| `open`            | ✅     | Open price                             |
| `timenow`         | ✅     | Current time                           |
| `volume`          | ✅     | Volume                                 |
| `ask`             |        | Ask price                              |
| `bid`             |        | Bid price                              |
| `dayofmonth`      | ✅     | Day of month                           |
| `dayofweek`       | ✅     | Day of week                            |
| `hour`            | ✅     | Hour                                   |
| `minute`          | ✅     | Minute                                 |
| `month`           | ✅     | Month                                  |
| `second`          | ✅     | Second                                 |
| `time`            | ✅     | Bar time                               |
| `time_close`      | ✅     | Bar close time                         |
| `time_tradingday` | ✅     | Trading day time                       |
| `weekofyear`      | ✅     | Week of year                           |
| `year`            | ✅     | Year                                   |

### Constants

| Function | Status | Description   |
| -------- | ------ | ------------- |
| `false`  | ✅     | Boolean false |
| `true`   | ✅     | Boolean true  |

### Functions

| Function           | Status | Description           |
| ------------------ | ------ | --------------------- |
| `indicator()`      | ✅     | Indicator declaration |
| `input()`          | ✅     | Input parameter       |
| `na()`             | ✅     | Check if value is NaN |
| `nz()`             | ✅     | Replace NaN with zero |
| `alert()`          | ✅     | Alert function        |
| `alertcondition()` | ✅     | Alert condition       |
| `bool()`           | ✅     | Boolean conversion    |
| `box()`            | ✅     | Box object            |
| `color()`          | ✅     | Color object          |
| `dayofmonth()`     | ✅     | Day of month function |
| `dayofweek()`      | ✅     | Day of week function  |
| `fill()`           | ✅     | Fill function         |
| `fixnan()`         | ✅     | Fix NaN values        |
| `float()`          | ✅     | Float conversion      |
| `hline()`          | ✅     | Horizontal line       |
| `hour()`           | ✅     | Hour function         |
| `int()`            | ✅     | Integer conversion    |
| `label()`          | ✅     | Label object          |
| `library()`        |        | Library declaration   |
| `line()`           | ✅     | Line object           |
| `linefill()`       | ✅     | Linefill object       |
| `max_bars_back()`  |        | Maximum bars back     |
| `minute()`         | ✅     | Minute function       |
| `month()`          | ✅     | Month function        |
| `second()`         | ✅     | Second function       |
| `strategy()`       |        | Strategy declaration  |
| `string()`         | ✅     | String conversion     |
| `table()`          | ✅     | Table object          |
| `time()`           | ✅     | Time function         |
| `time_close()`     | ✅     | Time close function   |
| `timestamp()`      | ✅     | Timestamp function    |
| `weekofyear()`     | ✅     | Week of year function |
| `year()`           | ✅     | Year function         |
| `runtime.error()`  | ✅     | Runtime error         |
