---
layout: default
title: Alerts
nav_order: 4
permalink: /alerts/
---

# Alerts

PineTS supports Pine Script's `alert()` and `alertcondition()` functions, allowing indicators and strategies to emit alert events that your application can capture and act on — for example, sending webhook notifications, triggering trades, or logging signals.

## Table of Contents

- [Overview](#overview)
- [alert()](#alert)
- [alertcondition()](#alertcondition)
- [Capturing Alerts](#capturing-alerts)
- [Alert Modes](#alert-modes)
- [Complete Examples](#complete-examples)

---

## Overview

| Function                                    | Purpose                                              | Fires when                      |
| ------------------------------------------- | ---------------------------------------------------- | ------------------------------- |
| `alert(message, freq)`                      | Imperative — fires when the code path executes it    | Code reaches the `alert()` call |
| `alertcondition(condition, title, message)` | Declarative — fires when a boolean condition is true | `condition` evaluates to `true` |

By default, alerts only fire on the **last (realtime) bar**, matching TradingView's behavior. Use `setAlertMode('all')` to fire on every bar for backtesting.

---

## alert()

Fires an alert event when executed. Supports frequency gating to control how often the alert triggers.

### Pine Script Syntax

```pine
//@version=6
indicator("EMA Cross Alert", overlay=true)

ema9 = ta.ema(close, 9)
ema21 = ta.ema(close, 21)

if ta.crossover(ema9, ema21)
    alert("Bullish EMA cross! Price: " + str.tostring(close), alert.freq_once_per_bar)

if ta.crossunder(ema9, ema21)
    alert("Bearish EMA cross! Price: " + str.tostring(close), alert.freq_once_per_bar)

plot(ema9, "EMA 9", color.blue)
plot(ema21, "EMA 21", color.red)
```

### Frequency Constants

| Constant                        | Behavior                                                            |
| ------------------------------- | ------------------------------------------------------------------- |
| `alert.freq_all`                | Every `alert()` call triggers (including multiple calls per bar)    |
| `alert.freq_once_per_bar`       | Only the **first** `alert()` call per bar triggers (default)        |
| `alert.freq_once_per_bar_close` | Only triggers on the bar's **final tick** (when it closes/confirms) |

If no frequency is specified, `alert.freq_once_per_bar` is used.

---

## alertcondition()

Registers a named alert condition that fires when a boolean expression is true. Unlike `alert()`, it doesn't support frequency gating — it fires once per bar when the condition is met.

### Pine Script Syntax

```pine
//@version=6
indicator("RSI Alert Conditions")

rsi = ta.rsi(close, 14)

alertcondition(rsi > 70, "Overbought", "RSI crossed above 70!")
alertcondition(rsi < 30, "Oversold", "RSI dropped below 30!")

plot(rsi, "RSI")
hline(70, "Overbought")
hline(30, "Oversold")
```

### Parameters

| Parameter   | Type           | Required | Description                         |
| ----------- | -------------- | -------- | ----------------------------------- |
| `condition` | `series bool`  | Yes      | When `true`, the alert fires        |
| `title`     | `const string` | No       | Name of the alert condition         |
| `message`   | `const string` | No       | Message included in the alert event |

---

## Capturing Alerts

### With run() (Promise-based)

After execution, alerts are available on the returned context object:

```typescript
import { PineTS, Provider } from 'pinets';

const pine = new PineTS(Provider.Binance, 'BTCUSDT', 'D', 100);

const code = `
//@version=6
indicator("Alert Demo")
if ta.crossover(ta.ema(close, 9), ta.ema(close, 21))
    alert("Bullish cross detected!", alert.freq_once_per_bar)
alertcondition(ta.rsi(close, 14) > 70, "Overbought", "RSI > 70")
plot(close)
`;

const ctx = await pine.run(code);

// Access all alert events
for (const a of ctx.alerts) {
    console.log(`[${a.type}] ${a.message} (bar ${a.bar_index})`);
}
```

### With stream() (Event-based)

In streaming mode, alerts are emitted as `'alert'` events in real time:

```typescript
import { PineTS, Provider } from 'pinets';

const pine = new PineTS(Provider.Binance, 'BTCUSDT', '1m', 100);

const code = `
//@version=6
indicator("Live Alert")
if ta.crossover(close, ta.sma(close, 20))
    alert("Price crossed above SMA 20!", alert.freq_once_per_bar)
plot(close)
`;

const evt = pine.stream(code, { live: true, interval: 5000 });

evt.on('alert', (alert) => {
    console.log('ALERT:', alert.message);
    // Send to webhook, trigger trade, send notification, etc.
    // sendWebhook(alert.message);
});

evt.on('data', (ctx) => {
    // Normal data processing
});

evt.on('error', (err) => {
    console.error('Error:', err);
});
```

### Alert Event Structure

Each alert event (whether from `alert()` or `alertcondition()`) has this shape:

```typescript
{
    type: 'alert' | 'alertcondition',
    message: string,          // The alert message
    title?: string,           // Title (alertcondition only)
    freq?: string,            // Frequency constant (alert only)
    bar_index: number,        // Bar index where the alert fired
    time: number              // Bar open time (ms timestamp)
}
```

---

## Alert Modes

By default, PineTS matches TradingView behavior: alerts only fire on the **last (realtime) bar**. Historical bars are silently skipped. This is the correct behavior for live trading.

For **backtesting**, you can switch to `'all'` mode to fire alerts on every bar:

```typescript
const pine = new PineTS(Provider.Binance, 'BTCUSDT', 'D', 365);

// Backtest mode — fire alerts on ALL bars
pine.setAlertMode('all');

const code = `
//@version=6
indicator("Backtest Alerts")
if ta.crossover(ta.ema(close, 9), ta.ema(close, 21))
    alert("Buy signal", alert.freq_once_per_bar)
if ta.crossunder(ta.ema(close, 9), ta.ema(close, 21))
    alert("Sell signal", alert.freq_once_per_bar)
plot(close)
`;

const ctx = await pine.run(code);

console.log(`Total alerts over ${ctx.marketData.length} bars: ${ctx.alerts.length}`);
for (const a of ctx.alerts) {
    const date = new Date(a.time).toISOString().slice(0, 10);
    console.log(`  ${date}: ${a.message}`);
}
```

| Mode                   | Behavior                         | Use case                     |
| ---------------------- | -------------------------------- | ---------------------------- |
| `'realtime'` (default) | Alerts fire only on the last bar | Live trading, webhooks       |
| `'all'`                | Alerts fire on every bar         | Backtesting, signal analysis |

---

## Complete Examples

### Example 1: Webhook-Ready Live Alerts

```typescript
import { PineTS, Provider } from 'pinets';

const pine = new PineTS(Provider.Binance, 'BTCUSDT', '5', 200);

const strategy = `
//@version=6
indicator("Scalp Alerts", overlay=true)

fast = ta.ema(close, 8)
slow = ta.ema(close, 21)
rsi = ta.rsi(close, 14)

// Multi-condition alert
if ta.crossover(fast, slow) and rsi > 50
    alert("LONG entry: EMA cross + RSI > 50 at " + str.tostring(close), alert.freq_once_per_bar)

if ta.crossunder(fast, slow) and rsi < 50
    alert("SHORT entry: EMA cross + RSI < 50 at " + str.tostring(close), alert.freq_once_per_bar)

plot(fast, "Fast EMA", color.green)
plot(slow, "Slow EMA", color.red)
`;

const evt = pine.stream(strategy, { live: true, interval: 10000 });

evt.on('alert', async (alert) => {
    console.log(`[${new Date().toISOString()}] ${alert.message}`);
    // await fetch('https://your-webhook.com/alerts', {
    //     method: 'POST',
    //     body: JSON.stringify(alert)
    // });
});

evt.on('data', (ctx) => {
    const close = ctx.marketData[ctx.idx]?.close;
    console.log(`Bar ${ctx.idx}: close=${close}`);
});
```

### Example 2: Backtest Signal Analysis

```typescript
import { PineTS, Provider } from 'pinets';

async function backtestAlerts() {
    const pine = new PineTS(Provider.Binance, 'BTCUSDT', 'D', undefined, new Date('2024-01-01').getTime(), new Date('2024-12-31').getTime());

    pine.setAlertMode('all');

    const code = `
//@version=6
indicator("Backtest Signals")
rsi = ta.rsi(close, 14)
alertcondition(rsi < 30, "Oversold", "RSI oversold — potential buy")
alertcondition(rsi > 70, "Overbought", "RSI overbought — potential sell")
plot(rsi)
    `;

    const ctx = await pine.run(code);

    const buys = ctx.alerts.filter((a) => a.title === 'Oversold');
    const sells = ctx.alerts.filter((a) => a.title === 'Overbought');

    console.log(`Oversold signals: ${buys.length}`);
    console.log(`Overbought signals: ${sells.length}`);

    for (const signal of ctx.alerts) {
        const date = new Date(signal.time).toISOString().slice(0, 10);
        console.log(`  ${date}: [${signal.title}] ${signal.message}`);
    }
}

backtestAlerts();
```

### Example 3: Custom Data with Alerts

```typescript
import { PineTS } from 'pinets';

const data = [
    { openTime: Date.now() - 86400000 * 5, open: 100, high: 110, low: 95, close: 105, volume: 1000, closeTime: Date.now() - 86400000 * 4 },
    { openTime: Date.now() - 86400000 * 4, open: 105, high: 115, low: 100, close: 112, volume: 1200, closeTime: Date.now() - 86400000 * 3 },
    { openTime: Date.now() - 86400000 * 3, open: 112, high: 120, low: 108, close: 98, volume: 800, closeTime: Date.now() - 86400000 * 2 },
    { openTime: Date.now() - 86400000 * 2, open: 98, high: 105, low: 90, close: 92, volume: 1500, closeTime: Date.now() - 86400000 * 1 },
    { openTime: Date.now() - 86400000 * 1, open: 92, high: 100, low: 88, close: 95, volume: 900, closeTime: Date.now() },
];

const pine = new PineTS(data);
pine.setAlertMode('all');

const code = `
//@version=6
indicator("Custom Alerts")
if close < open
    alert("Bearish bar at " + str.tostring(close))
plot(close)
`;

const ctx = await pine.run(code);
console.log('Alerts:', ctx.alerts.length);
```
