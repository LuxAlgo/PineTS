---
layout: default
title: Pagination & Live Streaming
nav_order: 6
permalink: /pagination/
---

# Pagination & Live Streaming

## Overview

PineTS supports **pagination** and **live streaming** for processing large datasets and real-time market data. The primary and recommended way to handle this is via the `stream()` method, which provides a convenient event-based interface.

This enables you to:

-   Process historical data in manageable chunks
-   Build responsive UIs that show progress
-   Stream live market data as new candles form
-   Build real-time trading bots and monitoring systems

## Using `PineTS.stream` (Recommended)

The `stream()` method unifies pagination and live streaming into a single, easy-to-use interface.

### Basic Usage

```typescript
import { PineTS, Provider } from 'pinets';

const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '1m');

const evt = pineTS.stream(
    (context) => {
        const { close } = context.data;
        const sma = context.ta.sma(close, 20);
        return { close, sma };
    },
    {
        pageSize: 50, // Process data in chunks of 50 bars
        live: true, // Continue with live updates after history
        interval: 1000, // Check for updates every 1 second
    }
);

evt.on('data', (ctx) => {
    // This callback runs for every historical page AND every live update
    const { close, sma } = ctx.result;
    console.log(`Received data. Latest Close: ${close[close.length - 1]}`);
});

evt.on('error', (err) => {
    console.error('Stream error:', err);
});

// To stop the stream manually
// evt.stop();
```

### Processing Historical Pages Only

If you only want to process historical data in pages (e.g., for memory efficiency or progress bars) without staying connected for live updates, set `live: false`.

```typescript
const evt = pineTS.stream(indicator, {
    pageSize: 100,
    live: false, // Stop after processing all historical data
});

evt.on('data', (ctx) => {
    console.log(`Processed page with ${ctx.result.close.length} bars`);
    // Update progress bar...
});
```

### Live Streaming

By default (`live: true`), `stream()` will seamlessly transition from processing historical data to fetching live updates.

1.  **Historical Phase**: `data` events are emitted for each page of historical data (size determined by `pageSize`).
2.  **Live Phase**: Once history is caught up, `data` events are emitted whenever new market data is available, polled at `interval` milliseconds.

```typescript
const evt = pineTS.stream(indicator, {
    pageSize: 100,
    live: true,
    interval: 2000, // Poll every 2 seconds
});

evt.on('data', (ctx) => {
    // Check if this is a historical chunk or a live update
    const currentCandle = ctx.marketData[ctx.idx];
    const isHistorical = currentCandle.closeTime < Date.now();

    if (isHistorical) {
        console.log('Processing history...');
    } else {
        console.log('⚡ LIVE UPDATE:', ctx.result);
    }
});
```

### Options

| Option     | Type      | Default           | Description                                                                                    |
| :--------- | :-------- | :---------------- | :--------------------------------------------------------------------------------------------- |
| `pageSize` | `number`  | `undefined` (all) | Number of bars per chunk. If not specified, processes all available historical data in one go. |
| `live`     | `boolean` | `true`            | Whether to continue fetching live data after processing historical data.                       |
| `interval` | `number`  | `1000`            | Polling interval in milliseconds for live data.                                                |

---

## Alternative: Using Iterator with `PineTS.run` (Advanced)

If you need more granular control over the execution flow (e.g., using `await` inside the loop before processing the next chunk), you can use the `run()` method with an iterator.

### Basic Iterator Usage

```typescript
// Process 100 candles in pages of 10
const iterator = pineTS.run(indicator, 100, 10);

for await (const page of iterator) {
    console.log(`Received ${page.result.sma.length} results`);
    // The loop pauses here until you process this page
    // Useful if you need to perform async operations for each page
}
```

### Manual Live Streaming with Iterator

When using `run()` with a provider and no end date, the iterator will automatically enter live mode. You must handle the polling wait time yourself when `null` is yielded.

```typescript
const iterator = pineTS.run(indicator, 50, 10);

for await (const page of iterator) {
    if (page === null) {
        // No new data yet, YOU must control the polling interval
        await new Promise((r) => setTimeout(r, 1000));
        continue;
    }

    const { sma } = page.result;
    console.log(`New data: SMA=${sma[sma.length - 1]}`);
}
```

### Comparison

| Feature            | `stream()` (Recommended)          | `run()` Iterator              |
| :----------------- | :-------------------------------- | :---------------------------- |
| **Interface**      | Event-based (`.on('data')`)       | Async Iterator (`for await`)  |
| **Control Flow**   | Non-blocking (callbacks)          | Blocking (awaits processing)  |
| **Live Polling**   | Automatic (handled by `interval`) | Manual (must implement sleep) |
| **Error Handling** | `.on('error')`                    | `try/catch` block             |
| **Complexity**     | Low                               | Medium/High                   |

## Use Cases

### Real-Time Trading Bot

Use `stream()` with `live: true`. The event-driven nature fits perfectly with reacting to market changes.

### Backtesting Progress Bar

Use `stream()` with `live: false` and `pageSize`. Update your UI's progress bar in the `data` callback.

### Complex Async Processing

Use `run()` iterator if you need to perform complex asynchronous operations (like database writes or expensive calculations) for each page and want to prevent new data from arriving until the current page is fully processed.

## Understanding Open vs Closed Candles

### What Are Open Candles?

In live trading, the **current candle** is still forming - its high, low, close, and volume are constantly changing. This is called an **open candle**.

### How PineTS Handles Open Candles

When live streaming (both `stream()` and `run()`), PineTS:

1.  **Always recalculates the last candle** when fetching new data
2.  **Updates OHLCV values** with the latest market data
3.  **Recalculates all indicators** for the updated candle
4.  **Returns updated results** so your indicators stay current

```typescript
// Watching a candle form in real-time
const evt = pineTS.stream(indicator, { live: true });
let previousClose = null;

evt.on('data', (ctx) => {
    const currentClose = ctx.result.close[ctx.result.close.length - 1];

    if (previousClose !== null && currentClose !== previousClose) {
        console.log('⚡ Candle updated:', currentClose);
    }
    previousClose = currentClose;
});
```

## Best Practices

### ✅ Do's

-   **Use `stream()`** for most use cases - it's simpler and less error-prone.
-   **Use pagination (`pageSize`)** for large datasets (>1000 candles) to save memory.
-   **Handle errors** by listening to the `error` event.
-   **Stop streams** using `evt.stop()` when they are no longer needed (e.g., component unmount).

### ❌ Don'ts

-   **Don't block the event loop** inside `data` callbacks. If you have heavy processing, consider offloading it.
-   **Don't set `interval` too low** (e.g., < 100ms) to avoid rate limiting from data providers.
