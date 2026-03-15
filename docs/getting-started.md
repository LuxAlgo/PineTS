---
layout: default
title: Getting Started
nav_order: 2
permalink: /getting-started/
---

# Getting Started with PineTS

PineTS is a JavaScript/TypeScript runtime that enables execution of Pine Script indicators in JavaScript environments. It supports two input formats:

1. **Native Pine Script v5/v6** - Run original Pine Script code directly
2. **PineTS Syntax** - A JavaScript/TypeScript syntax that closely mirrors Pine Script

It preserves the original functionality and behavior while providing robust handling of time-series data processing, technical analysis calculations, and Pine Script's distinctive scoping mechanisms.

## Installation

```bash
npm install pinets
```

## Usage Examples

### Option 1: Run Native Pine Script Directly

Starting with v0.7.0, you can run original Pine Script code directly without conversion:

```javascript
import { PineTS, Provider } from 'pinets';

// Initialize with market data
const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', 'D', 100);

// Run native Pine Script directly - no conversion needed!
const pineScriptCode = `
//@version=5
indicator('My EMA Cross Strategy')

ema9 = ta.ema(close, 9)
ema18 = ta.ema(close, 18)

bull_bias = ema9 > ema18
bear_bias = ema9 < ema18

prev_close = close[1]
diff_close = close - prev_close

plot(ema9, title = '9 EMA', color = color.yellow)
plot(ema18, title = '18 EMA', color = color.red)
`;

const { result, plots } = await pineTS.run(pineScriptCode);
// Access results: result.ema9, result.ema18, result.bull_bias, result.bear_bias
```

### Option 3: Runtime Inputs

You can pass dynamic values to your indicator's `input()` functions at runtime using the `Indicator` class. This allows you to change parameters without modifying the code.

```javascript
import { PineTS, Provider, Indicator } from 'pinets';

const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', 'D', 100);

const code = `
//@version=5
indicator("Dynamic MA")
len = input.int(14, "Length")
src = input.source(close, "Source")
plot(ta.sma(src, len))
`;

// Override default input values
const indicator = new Indicator(code, {
    Length: 50, // Use 50 instead of 14
});

const { result } = await pineTS.run(indicator);
```

> **⚠️ Note**: Native Pine Script support is experimental. Some indicators may fail if they use API features not yet implemented. Check the [API Coverage](../api-coverage/) pages to verify compatibility.

---

### Option 2: Use PineTS Syntax

If you prefer or need more control, you can use PineTS syntax, which is a JavaScript/TypeScript version with minimal differences from Pine Script.

#### Converting Pine Script to PineTS

Original Pine Script:

```javascript
//@version=5
indicator('My EMA Cross Strategy');

ema9 = ta.ema(close, 9);
ema18 = ta.ema(close, 18);

bull_bias = ema9 > ema18;
bear_bias = ema9 < ema18;

prev_close = close[1];
diff_close = close - prev_close;

_oo = open;
_oo = math.abs(open[1] - close[2]);
```

Equivalent PineTS syntax:

```javascript
const ema9 = ta.ema(close, 9);
const ema18 = ta.ema(close, 18);

const bull_bias = ema9 > ema18;
const bear_bias = ema9 < ema18;

const prev_close = close[1];
const diff_close = close - prev_close;

let _oo = open;
_oo = math.abs(open[1] - close[2]);
```

#### Running PineTS Syntax Code

```javascript
import { PineTS, Provider } from 'pinets';

// Initialize with market data
const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', 'D', 100);

// Run your indicator
const { result } = await pineTS.run((context) => {
    const ta = context.ta;
    const math = context.math;
    const { close, open } = context.data;

    const ema9 = ta.ema(close, 9);
    const ema18 = ta.ema(close, 18);

    const bull_bias = ema9 > ema18;
    const bear_bias = ema9 < ema18;

    const prev_close = close[1];
    const diff_close = close - prev_close;

    let _oo = open;
    _oo = math.abs(open[1] - close[2]);
});
```

## Streaming Data and Pagination

For processing large datasets efficiently or handling live data streams, use the `stream()` method:

```javascript
import { PineTS, Provider } from 'pinets';

// Initialize with a provider
const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '1m', 100);

// Start streaming
const evt = pineTS.stream(
    (context) => {
        const { close } = context.data;
        const sma = context.ta.sma(close, 14);
        return { close, sma };
    },
    {
        pageSize: 50, // Process in chunks of 50
        live: true, // Continue with live data
        interval: 2000, // Poll every 2 seconds
    },
);

// Listen for updates
evt.on('data', (ctx) => {
    const { close, sma } = ctx.result;
    console.log(`Update: Close=${close[close.length - 1]}, SMA=${sma[sma.length - 1]}`);
});

evt.on('error', (err) => console.error(err));

// To stop streaming later
// evt.stop();
```

**Benefits:**

- Memory efficient for large datasets
- Event-based interface is easier to integrate
- Automatically streams live market data
- Perfect for real-time trading bots and dashboards

📖 **For complete pagination and streaming documentation, see [Pagination & Live Streaming](../pagination/).**

## Key Differences: PineTS Syntax vs Native Pine Script

When using **PineTS syntax** (Option 2), note these differences from native Pine Script:

1. **Variable Declaration**: Use JavaScript's `const`, `let`, and `var` instead of Pine Script's implicit declaration
2. **Function Syntax**: JavaScript arrow functions and standard function syntax
3. **Module System**: Import Pine Script namespaces from context: `const { ta, math } = context; const { close, open } = context.data;`
4. **Object Syntax**: Use JavaScript object notation for parameters: `plot(value, { title: 'My Plot', color: color.yellow })`
5. **Scoping Rules**: Maintains Pine Script's series behavior through runtime transformation
6. **Return Syntax**: Can return an object with indicator results for easy access in JavaScript

When using **Native Pine Script** (Option 1), write code exactly as you would in TradingView - no conversion needed!

## Data Providers

PineTS includes built-in providers for multiple data sources:

| Provider | Market | API Key |
| --- | --- | --- |
| `Provider.Binance` | Crypto | Not required |
| `Provider.FMP` | Stocks, forex, crypto | Required |
| `Provider.Alpaca` | US stocks, crypto | Required |

You can also pass your own OHLCV data array instead of using a provider. See the **[Data Providers](../data-providers/)** page for configuration details and examples.

## Core Components

### PineTS Class

The main class that handles:

- Market data management
- Series calculations
- Built-in variables (open, high, low, close, volume, etc.)
- Runtime execution context

### Namespaces

- **Core**: Essential Pine Script functionality and base operations
- **TechnicalAnalysis**: Comprehensive set of technical indicators and analysis functions
- **PineMath**: Mathematical operations and precision handling
- **Input**: Parameter and input management system
- **Syminfo**: Symbol information and market data helpers

## Project Status

For the current implementation status:

- See [Language Coverage](../lang-coverage/) for language features
- See [API Coverage](../api-coverage/) for API functions and methods

## Next Steps

After getting started, try exploring our demo indicators:

- [WillVixFix Indicator](../indicators/willvixfix/index.html)
- [Squeeze Momentum Indicator](../indicators/sqzmom/index.html)

Or contribute to the project on [GitHub](https://github.com/alaa-eddine/PineTS)!
