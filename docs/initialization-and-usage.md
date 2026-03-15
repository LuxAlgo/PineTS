---
layout: default
title: Initialization and Usage
nav_order: 3
permalink: /initialization-and-usage/
---

# Initialization and Usage

This guide explains how to initialize PineTS and run indicators or strategies with detailed documentation of all available options and return values.

## Table of Contents

-   [Installation](#installation)
-   [PineTS Constructor](#pinets-constructor)
-   [Initialization Options](#initialization-options)
-   [The run() Method](#the-run-method)
-   [The stream() Method](#the-stream-method)
-   [Context Object](#context-object)
-   [Return Values](#return-values)
-   [Complete Examples](#complete-examples)

---

## Installation

```bash
npm install pinets
```

---

## PineTS Constructor

The `PineTS` class is the main entry point for working with indicators and strategies.

### Syntax

```typescript
const pineTS = new PineTS(
    source: IProvider | any[],
    tickerId?: string,
    timeframe?: string,
    limit?: number,
    sDate?: number,
    eDate?: number
);
```

### Parameters

| Parameter   | Type                 | Required | Description                                                                          |
| ----------- | -------------------- | -------- | ------------------------------------------------------------------------------------ |
| `source`    | `IProvider \| any[]` | Yes      | Either a data provider instance (e.g., `Provider.Binance`) or an array of OHLCV data |
| `tickerId`  | `string`             | No\*     | The trading pair symbol (e.g., `'BTCUSDT'`). Required when using a provider          |
| `timeframe` | `string`             | No\*     | The timeframe/interval for the data. Required when using a provider                  |
| `limit`     | `number`             | No       | Maximum number of candles to fetch (default: provider-specific, max 5000)            |
| `sDate`     | `number`             | No       | Start date in milliseconds timestamp. Used for date range queries                    |
| `eDate`     | `number`             | No       | End date in milliseconds timestamp. Used for date range queries                      |

\* Required when using a provider, optional when passing an array of data

### Understanding Candle Fetching and Ordering

#### How `limit` Works

When you specify a `limit` without date ranges, PineTS fetches the **most recent candles working backwards** from the current time:

```typescript
// Fetches the last 100 daily candles (most recent)
const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', 'D', 100);
// Result: 100 candles from ~100 days ago until now
```

**Important notes:**

-   Data is fetched from **newest to oldest** from the exchange
-   Maximum limit is **5000 candles** (hard cap, might be changed in the future as we optimize the runtime performance)
-   If no limit is specified, the provider's default is used (varies by provider)

#### How Date Ranges Work

When you specify `sDate` and `eDate`, PineTS fetches all candles within that date range:

```typescript
const startDate = new Date('2024-01-01').getTime(); // Start: Jan 1, 2024
const endDate = new Date('2024-12-31').getTime(); // End: Dec 31, 2024

const pineTS = new PineTS(
    Provider.Binance,
    'BTCUSDT',
    'D',
    undefined, // No limit - use date range instead
    startDate,
    endDate
);
// Result: All daily candles from Jan 1 to Dec 31, 2024
```

**Date range behavior:**

-   Fetches **all candles** between `sDate` and `eDate`
-   If the date range spans more than 1000 candles, PineTS automatically handles pagination
-   Still subject to the 5000 candle maximum
-   Data is ordered chronologically (oldest to newest)

#### Priority and Combinations

| Scenario                           | Behavior                                           |
| ---------------------------------- | -------------------------------------------------- |
| Only `limit` specified             | Fetches the last `limit` candles from now          |
| Only `sDate` and `eDate` specified | Fetches all candles in the date range (up to 5000) |
| Both `limit` and date range        | Date range is used, `limit` is ignored             |
| Neither specified                  | Uses provider default (typically 500-1000 candles) |

#### Data Ordering After Fetching

Regardless of how data is fetched, PineTS ensures the data is in **chronological order**:

```typescript
// After initialization, data is ordered: [oldest ... newest]
const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', 'D', 100);

await pineTS.run((context) => {
    const { close } = context.data;

    // close[0] = current bar (most recent)
    // close[1] = previous bar
    // close[2] = 2 bars ago
    // ... and so on

    console.log('Current close:', close[0]);
    console.log('Previous close:', close[1]);
});
```

**Time series indexing:**

-   `[0]` = current/most recent bar
-   `[1]` = previous bar
-   `[2]` = 2 bars ago
-   This matches Pine Script's time series behavior

#### Examples of Different Fetching Scenarios

```typescript
// Example 1: Last 100 candles (from now backwards)
const recent = new PineTS(Provider.Binance, 'BTCUSDT', '1h', 100);
// Gets: ~100 hours of data up to current time

// Example 2: Specific date range (all candles in range)
const historical = new PineTS(Provider.Binance, 'ETHUSDT', 'D', undefined, new Date('2023-01-01').getTime(), new Date('2023-12-31').getTime());
// Gets: All daily candles in 2023 (365 candles)

// Example 3: Large limit (will be capped at 5000)
const maxData = new PineTS(Provider.Binance, 'BTCUSDT', '1h', 10000);
// Gets: Only 5000 most recent hourly candles (max cap)

// Example 4: No limit (provider default)
const defaultData = new PineTS(Provider.Binance, 'BTCUSDT', 'D');
// Gets: Provider default amount (typically 500-1000 candles)
```

---

## Initialization Options

### Option 1: Using a Data Provider

The easiest way to initialize PineTS is using a built-in data provider:

```typescript
import { PineTS, Provider } from 'pinets';

// Basic initialization with limit
const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', 'D', 100);

// With date range
const startDate = new Date('2024-01-01').getTime();
const endDate = new Date('2024-12-31').getTime();
const pineTSWithDateRange = new PineTS(
    Provider.Binance,
    'ETHUSDT',
    '1h',
    undefined, // no limit
    startDate,
    endDate
);
```

#### Available Providers

| Provider | Usage | API Key | Best For |
| --- | --- | --- | --- |
| `Provider.Binance` | Crypto market data | Not required | Cryptocurrency |
| `Provider.FMP` | Stocks, forex, crypto | Required | US/intl stocks |
| `Provider.Alpaca` | US stocks, crypto | Required (key + secret) | US equities |

Providers that require API keys must be configured before use. See the **[Data Providers](../data-providers/)** page for detailed setup instructions, configuration options, and examples for each provider.

#### Supported Timeframes

All providers support the standard timeframe strings: `'1'`, `'3'`, `'5'`, `'15'`, `'30'`, `'60'`, `'120'`, `'240'`, `'D'`, `'W'`, `'M'`. Timeframes not natively supported by a provider are automatically aggregated from smaller candles. See the **[Timeframe Reference](../data-providers/#timeframe-reference)** for the full support matrix.

### Option 2: Using Custom Data

You can also provide your own OHLCV data as an array:

```typescript
import { PineTS } from 'pinets';

const customData = [
    {
        openTime: 1640995200000,
        open: 46000,
        high: 47000,
        low: 45500,
        close: 46500,
        volume: 1234.56,
        closeTime: 1641081599999,
    },
    // ... more candles
];

const pineTS = new PineTS(customData);
```

#### Custom Data Format

Each data point in the array must include:

| Field       | Type     | Required | Description                           |
| ----------- | -------- | -------- | ------------------------------------- |
| `open`      | `number` | Yes      | Opening price                         |
| `high`      | `number` | Yes      | Highest price                         |
| `low`       | `number` | Yes      | Lowest price                          |
| `close`     | `number` | Yes      | Closing price                         |
| `volume`    | `number` | Yes      | Trading volume                        |
| `openTime`  | `number` | No       | Opening time (milliseconds timestamp) |
| `closeTime` | `number` | No       | Closing time (milliseconds timestamp) |

---

## The run() Method

The `run()` method executes your indicator or strategy code across all candles in the dataset.

### Syntax

```typescript
const context = await pineTS.run(
    pineTSCode: Indicator | Function | String,
    n?: number
): Promise<Context>
```

### Parameters

| Parameter    | Type                              | Default     | Description                                                                              |
| ------------ | --------------------------------- | ----------- | ---------------------------------------------------------------------------------------- |
| `pineTSCode` | `Indicator \| Function \| String` | Required    | The indicator/strategy function to execute. Use `Indicator` class to pass runtime inputs |
| `n`          | `number`                          | All periods | Number of most recent periods to process. If not specified, processes all available data |

### Running with Runtime Inputs

To pass custom input values to your indicator at runtime, use the `Indicator` class:

```typescript
import { PineTS, Provider, Indicator } from 'pinets';

// Your indicator code (Native Pine Script or PineTS syntax)
const code = `
//@version=5
indicator("My Indicator")
len = input.int(14, "Length")
src = input.source(close, "Source")
plot(ta.sma(src, len))
`;

// Initialize PineTS
const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', 'D', 100);

// Create Indicator with custom inputs
// Keys must match the 'title' argument in input.* calls
const indicator = new Indicator(code, {
    Length: 50, // Override default 14
});

// Run with inputs
const { result } = await pineTS.run(indicator);
```

### Return Value

Returns a `Promise<Context>` object containing:

-   `result`: The computed indicator values
-   `data`: Market data arrays (open, high, low, close, volume, etc.)
-   `plots`: Any plot data generated
-   Additional context properties

---

## The stream() Method

The `stream()` method provides an event-based interface for handling live data streams, making it easy to integrate with real-time applications.

### Syntax

```typescript
const evt = pineTS.stream(
    pineTSCode: Indicator | Function | String,
    options?: {
        pageSize?: number,
        live?: boolean,
        interval?: number
    }
);
```

### Options

| Option     | Type      | Default           | Description                                                                                    |
| ---------- | --------- | ----------------- | ---------------------------------------------------------------------------------------------- |
| `pageSize` | `number`  | `undefined` (all) | Number of bars per chunk. If not specified, processes all available historical data in one go. |
| `live`     | `boolean` | `true`            | Whether to continue fetching live data after processing historical data.                       |
| `interval` | `number`  | `1000`            | Polling interval in milliseconds for live data.                                                |

### Usage

The method returns an object with `on()` and `stop()` methods:

```typescript
// Start streaming
const evt = pineTS.stream(indicator, { pageSize: 1, live: true, interval: 2000 });

// Handle data updates
evt.on('data', (context) => {
    // Process new data
    console.log('New data:', context.result);
});

// Handle errors
evt.on('error', (error) => {
    console.error('Stream error:', error);
});

// Stop streaming
// evt.stop();
```

---

## Context Object

The context object is passed to your indicator function and contains all the data and utilities needed for calculations.

### Available Properties

```typescript
interface Context {
    // Market data (time-series arrays)
    data: {
        open: number[]; // Opening prices
        high: number[]; // Highest prices
        low: number[]; // Lowest prices
        close: number[]; // Closing prices
        volume: number[]; // Volume data
        hl2: number[]; // (high + low) / 2
        hlc3: number[]; // (high + low + close) / 3
        ohlc4: number[]; // (open + high + low + close) / 4
        openTime: number[]; // Opening timestamps
        closeTime: number[]; // Closing timestamps
    };

    // Pine Script namespaces
    ta: TechnicalAnalysis; // Technical analysis functions
    math: PineMath; // Mathematical operations
    input: Input; // Input parameters
    request: PineRequest; // Data requests
    array: PineArray; // Array operations
    core: {
        plot: Function; // Plot data
        plotchar: Function; // Plot characters
        na: Function; // Not-a-number handling
        nz: Function; // Replace NaN with zero
        color: any; // Color utilities
    };

    // Execution state
    idx: number; // Current bar index
    NA: any; // Not-a-number constant (NaN)

    // Variable scopes (for Pine Script compatibility)
    params: any; // Parameter variables
    const: any; // Constant variables
    var: any; // Var-scoped variables
    let: any; // Let-scoped variables

    // Results
    result: any; // Computed results
    plots: any; // Plot data

    // Market context
    marketData: any[]; // Raw market data
    source: IProvider | any[]; // Data source
    tickerId: string; // Trading pair
    timeframe: string; // Timeframe
    limit: number; // Data limit
    sDate: number; // Start date
    eDate: number; // End date
}
```

### Quick Access to Common Data

```typescript
const { result } = await pineTS.run((context) => {
    // Destructure commonly used items
    const { ta, math, core } = context;
    const { close, open, high, low, volume } = context.data;

    // Your indicator logic here
    const ema9 = ta.ema(close, 9);
    const ema21 = ta.ema(close, 21);

    return { ema9, ema21 };
});
```

---

## Return Values

The `run()` method returns different formats depending on what your indicator returns:

### Single Value Return

If your indicator returns a single value, `context.result` will be an array:

```typescript
const { result } = await pineTS.run((context) => {
    const { ta } = context;
    const { close } = context.data;

    const sma = ta.sma(close, 20);
    return sma; // Single value
});

// result is an array of numbers
console.log(result); // [45123.5, 45234.2, 45345.8, ...]
```

### Object Return (Multiple Values)

If your indicator returns an object, `context.result` will be an object with arrays:

```typescript
const { result } = await pineTS.run((context) => {
    const { ta } = context;
    const { close } = context.data;

    const ema9 = ta.ema(close, 9);
    const ema21 = ta.ema(close, 21);
    const rsi = ta.rsi(close, 14);

    return { ema9, ema21, rsi }; // Object with multiple values
});

// result is an object with arrays
console.log(result.ema9); // [45123.5, 45234.2, ...]
console.log(result.ema21); // [44987.3, 45098.7, ...]
console.log(result.rsi); // [65.4, 67.2, ...]
```

### Accessing the Full Context

You can access the entire context object for more information:

```typescript
const context = await pineTS.run((context) => {
    const { ta } = context;
    const { close } = context.data;

    const ema = ta.ema(close, 9);
    return { ema };
});

console.log(context.result); // The indicator results
console.log(context.data); // Market data
console.log(context.tickerId); // 'BTCUSDT'
console.log(context.timeframe); // 'D'
console.log(context.marketData); // Raw OHLCV data
```

---

## Complete Examples

### Example 1: Simple Moving Average

```typescript
import { PineTS, Provider } from 'pinets';

async function runSMA() {
    // Initialize with 200 daily candles
    const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', 'D', 200);

    // Calculate 20-period SMA
    const { result } = await pineTS.run((context) => {
        const { ta } = context;
        const { close } = context.data;

        const sma20 = ta.sma(close, 20);
        return sma20;
    });

    console.log('SMA(20):', result);
}

runSMA();
```

### Example 2: Multiple Indicators

```typescript
import { PineTS, Provider } from 'pinets';

async function runMultipleIndicators() {
    const pineTS = new PineTS(Provider.Binance, 'ETHUSDT', '4H', 500);

    const { result } = await pineTS.run((context) => {
        const { ta, math } = context;
        const { close, high, low } = context.data;

        // Calculate multiple indicators
        const rsi = ta.rsi(close, 14);
        const [macd, signal, histogram] = ta.macd(close, 12, 26, 9);
        const [upperBand, middleBand, lowerBand] = ta.bb(close, 20, 2);
        const atr = ta.atr(high, low, close, 14);

        // Return all results
        return {
            rsi,
            macd,
            signal,
            histogram,
            upperBB: upperBand,
            middleBB: middleBand,
            lowerBB: lowerBand,
            atr,
        };
    });

    console.log('RSI:', result.rsi);
    console.log('MACD:', result.macd);
    console.log('ATR:', result.atr);
}

runMultipleIndicators();
```

### Example 3: With Date Range

```typescript
import { PineTS, Provider } from 'pinets';

async function runWithDateRange() {
    const startDate = new Date('2024-01-01').getTime();
    const endDate = new Date('2024-06-30').getTime();

    const pineTS = new PineTS(
        Provider.Binance,
        'BTCUSDT',
        'D',
        undefined, // No limit, use date range
        startDate,
        endDate
    );

    const { result } = await pineTS.run((context) => {
        const { ta } = context;
        const { close } = context.data;

        const ema50 = ta.ema(close, 50);
        const ema200 = ta.ema(close, 200);

        return {
            ema50,
            ema200,
            bullish: ema50 > ema200,
        };
    });

    console.log('EMA50:', result.ema50);
    console.log('EMA200:', result.ema200);
    console.log('Bullish signals:', result.bullish);
}

runWithDateRange();
```

### Example 4: Custom Data

```typescript
import { PineTS } from 'pinets';

async function runWithCustomData() {
    const customData = [
        { open: 100, high: 105, low: 99, close: 103, volume: 1000, openTime: Date.now() - 86400000 * 99, closeTime: Date.now() - 86400000 * 98 },
        { open: 103, high: 108, low: 102, close: 107, volume: 1200, openTime: Date.now() - 86400000 * 98, closeTime: Date.now() - 86400000 * 97 },
        // ... more data
    ];

    const pineTS = new PineTS(customData);

    const { result } = await pineTS.run((context) => {
        const { ta } = context;
        const { close } = context.data;

        const sma10 = ta.sma(close, 10);
        return { sma10 };
    });

    console.log('SMA(10):', result.sma10);
}

runWithCustomData();
```

### Example 5: Processing Last N Periods Only

```typescript
import { PineTS, Provider } from 'pinets';

async function runLastNPeriods() {
    // Fetch 1000 candles
    const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', 'D', 1000);

    // But only process the last 100
    const { result } = await pineTS.run((context) => {
        const { ta } = context;
        const { close } = context.data;

        const rsi = ta.rsi(close, 14);
        return { rsi };
    }, 100); // Only process last 100 periods

    console.log('RSI (last 100 periods):', result.rsi);
}

runLastNPeriods();
```

### Example 6: Using TA Cache for Performance

```typescript
import { PineTS, Provider } from 'pinets';

async function runWithCache() {
    const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '1h', 5000);

    // Enable TA cache for better performance on large datasets
    const { result } = await pineTS.run(
        (context) => {
            const { ta } = context;
            const { close } = context.data;

            const ema20 = ta.ema(close, 20);
            const ema50 = ta.ema(close, 50);

            return { ema20, ema50 };
        },
        undefined,
        true
    ); // Enable cache

    console.log('Results computed with caching enabled');
}

runWithCache();
```

### Example 7: Complex Strategy

```typescript
import { PineTS, Provider } from 'pinets';

async function runComplexStrategy() {
    const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', 'D', 365);

    const context = await pineTS.run((ctx) => {
        const { ta, math } = ctx;
        const { close, high, low, volume } = ctx.data;

        // Multiple indicator calculation
        const rsi = ta.rsi(close, 14);
        const [macd, signal, _] = ta.macd(close, 12, 26, 9);
        const atr = ta.atr(high, low, close, 14);
        const volumeSMA = ta.sma(volume, 20);

        // Generate signals
        const buySignal = rsi < 30 && macd > signal && volume > volumeSMA;
        const sellSignal = rsi > 70 && macd < signal;

        // Calculate stop loss and take profit levels
        const stopLoss = close - atr * 2;
        const takeProfit = close + atr * 3;

        return {
            rsi,
            macd,
            signal,
            atr,
            buySignal,
            sellSignal,
            stopLoss,
            takeProfit,
            price: close,
        };
    });

    // Access results
    const { result } = context;

    // Find trading opportunities
    console.log('Last RSI:', result.rsi[result.rsi.length - 1]);
    console.log('Last MACD:', result.macd[result.macd.length - 1]);

    // Count signals
    const buyCount = result.buySignal.filter(Boolean).length;
    const sellCount = result.sellSignal.filter(Boolean).length;
    console.log(`Buy signals: ${buyCount}, Sell signals: ${sellCount}`);
}

runComplexStrategy();
```

---

## Tips and Best Practices

### 1. Waiting for Data to Load

Always use `await` with `pineTS.run()` since data fetching is asynchronous:

```typescript
// ✅ Correct
const { result } = await pineTS.run((context) => { ... });

// ❌ Wrong - will not work properly
const { result } = pineTS.run((context) => { ... }); // Missing await
```

### 2. Destructuring for Cleaner Code

Destructure the context for more readable code:

```typescript
const { result } = await pineTS.run((context) => {
    // Destructure for cleaner access
    const { ta, math } = context;
    const { close, open, high, low } = context.data;

    // Now you can use them directly
    const sma = ta.sma(close, 20);
    return sma;
});
```

### 3. Return Objects for Multiple Values

When calculating multiple indicators, return them as an object:

```typescript
// ✅ Return multiple values as object
return { sma, ema, rsi };

// ❌ Less convenient - only returns one value
return sma;
```

### 4. Performance Optimization

For large datasets or complex calculations:

```typescript
// Enable TA cache
const { result } = await pineTS.run(indicatorFn, undefined, true);

// Or process fewer periods
const { result } = await pineTS.run(indicatorFn, 100); // Last 100 periods only
```

### 5. Error Handling

Always wrap your PineTS code in try-catch blocks:

```typescript
try {
    const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', 'D', 100);
    const { result } = await pineTS.run((context) => {
        // Your indicator logic
    });
    console.log(result);
} catch (error) {
    console.error('Error running indicator:', error);
}
```

---

## Next Steps

-   Check [API Coverage](../api-coverage/) to see all available technical analysis functions
-   Explore [Language Coverage](../lang-coverage/) to understand Pine Script compatibility
-   Try our demo indicators: [WillVixFix](../indicators/willvixfix/index.html) and [Squeeze Momentum](../indicators/sqzmom/index.html)
-   Contribute on [GitHub](https://github.com/alaa-eddine/PineTS)
