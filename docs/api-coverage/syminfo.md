---
layout: default
title: Syminfo
parent: API Coverage
---

## Syminfo

Symbol information namespace providing metadata about the current trading symbol.

### Symbol Identification

| Constant                   | Status | Description                                               |
| -------------------------- | ------ | --------------------------------------------------------- |
| `syminfo.current_contract` | ✅     | Contract name for futures (e.g., "Perpetual")             |
| `syminfo.description`      | ✅     | Human-readable description (e.g., "BTC / USDT Perpetual") |
| `syminfo.isin`             | ✅     | ISIN code (empty for crypto)                              |
| `syminfo.main_tickerid`    | ✅     | Main ticker identifier                                    |
| `syminfo.prefix`           | ✅     | Exchange identifier (e.g., "BINANCE")                     |
| `syminfo.root`             | ✅     | Base asset/root symbol (e.g., "BTC")                      |
| `syminfo.ticker`           | ✅     | Symbol name (e.g., "BTCUSDT", "BTCUSDT.P")                |
| `syminfo.tickerid`         | ✅     | Exchange:Symbol format (e.g., "BINANCE:BTCUSDT"); carries the chart-type modifier on a non-standard chart (e.g., "BINANCE:BTCUSDT;heikinashi" — see note) |
| `syminfo.type`             | ✅     | Instrument type ("crypto" or "futures")                   |
| `syminfo.prefix()`         |        | Prefix function                                           |
| `syminfo.ticker()`         |        | Ticker function                                           |

### Currency & Location

| Constant               | Status | Description                            |
| ---------------------- | ------ | -------------------------------------- |
| `syminfo.basecurrency` | ✅     | Base currency (e.g., "BTC")            |
| `syminfo.currency`     | ✅     | Quote currency (e.g., "USDT")          |
| `syminfo.timezone`     | ✅     | Timezone (always "Etc/UTC" for crypto) |
| `syminfo.country`      | ✅     | Country code (empty for crypto)        |

### Price & Contract Info

| Constant              | Status | Description                                    |
| --------------------- | ------ | ---------------------------------------------- |
| `syminfo.mintick`     | ✅     | Minimum price increment (from Binance filters) |
| `syminfo.pricescale`  | ✅     | Price scale (inverse of tick size)             |
| `syminfo.minmove`     | ✅     | Minimum movement (always 1)                    |
| `syminfo.pointvalue`  | ✅     | Point value/contract multiplier                |
| `syminfo.mincontract` | ✅     | Minimum contract size (from Binance filters)   |

### Session & Market

| Constant                  | Status | Description                                                    |
| ------------------------- | ------ | -------------------------------------------------------------- |
| `syminfo.session`         | ✅     | Trading session (always "24x7" for crypto)                     |
| `syminfo.volumetype`      | ✅     | Volume type (always "base" for crypto)                         |
| `syminfo.expiration_date` | ✅     | Contract expiration (0 for perpetuals, timestamp for delivery) |

### Company Data

| Constant                           | Status | Description                                        |
| ---------------------------------- | ------ | -------------------------------------------------- |
| `syminfo.employees`                | ✅     | Number of employees (N/A for crypto, returns 0)    |
| `syminfo.industry`                 | ✅     | Industry sector (N/A for crypto, returns "")       |
| `syminfo.sector`                   | ✅     | Market sector (N/A for crypto, returns "")         |
| `syminfo.shareholders`             | ✅     | Number of shareholders (N/A for crypto, returns 0) |
| `syminfo.shares_outstanding_float` | ✅     | Float shares (N/A for crypto, returns 0)           |
| `syminfo.shares_outstanding_total` | ✅     | Total shares (N/A for crypto, returns 0)           |

### Analyst Ratings

| Constant                              | Status | Description                                             |
| ------------------------------------- | ------ | ------------------------------------------------------- |
| `syminfo.recommendations_buy`         | ✅     | Buy recommendations (N/A for crypto, returns 0)         |
| `syminfo.recommendations_buy_strong`  | ✅     | Strong buy recommendations (N/A for crypto, returns 0)  |
| `syminfo.recommendations_date`        | ✅     | Recommendations date (N/A for crypto, returns 0)        |
| `syminfo.recommendations_hold`        | ✅     | Hold recommendations (N/A for crypto, returns 0)        |
| `syminfo.recommendations_sell`        | ✅     | Sell recommendations (N/A for crypto, returns 0)        |
| `syminfo.recommendations_sell_strong` | ✅     | Strong sell recommendations (N/A for crypto, returns 0) |
| `syminfo.recommendations_total`       | ✅     | Total recommendations (N/A for crypto, returns 0)       |

### Price Targets

| Constant                         | Status | Description                                      |
| -------------------------------- | ------ | ------------------------------------------------ |
| `syminfo.target_price_average`   | ✅     | Average price target (N/A for crypto, returns 0) |
| `syminfo.target_price_date`      | ✅     | Price target date (N/A for crypto, returns 0)    |
| `syminfo.target_price_estimates` | ✅     | Number of estimates (N/A for crypto, returns 0)  |
| `syminfo.target_price_high`      | ✅     | High price target (N/A for crypto, returns 0)    |
| `syminfo.target_price_low`       | ✅     | Low price target (N/A for crypto, returns 0)     |
| `syminfo.target_price_median`    | ✅     | Median price target (N/A for crypto, returns 0)  |

## Implementation Notes

### Chart-Type Modifier in `tickerid`

On a non-standard chart — declared by constructing PineTS with an extended ticker, e.g. `new PineTS(source, 'BTCUSDT;heikinashi', 'D', …)` — `syminfo.tickerid` carries the chart-type suffix (`"BINANCE:BTCUSDT;heikinashi"`), matching TradingView's behavior of encoding the chart type into the ticker id. `syminfo.ticker` stays clean. `ticker.standard(syminfo.tickerid)` strips the modifier; passing the modified `tickerid` to `request.security` routes a chart-typed data request to the data source (see [Ticker](ticker.html) and [Chart](chart.html)).

### Binance Provider

The `BinanceProvider` implementation supports:

-   **Spot Markets**: Standard symbols like `BTCUSDT`, `ETHUSDT`
-   **Perpetual Futures**: Symbols with `.P` suffix like `BTCUSDT.P`, `ETHUSDT.P`
-   **Delivery Futures**: Symbols with `_` like `BTCUSD_210625`

### Market Type Detection

-   Symbols ending with `.P` → Perpetual futures (uses `fapi.binance.com`)
-   Symbols containing `_` → Delivery futures (uses `dapi.binance.com`)
-   Other symbols → Spot market (uses `api.binance.com`)
