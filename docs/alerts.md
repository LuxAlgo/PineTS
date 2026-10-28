---
layout: default
title: Alerts
nav_order: 5
permalink: /alerts/
---

# Alerts

PineTS supports Pine Script's `alert()` and `alertcondition()` functions and the order-fill alerts of strategies, allowing scripts to emit alert events that your application can capture and act on — for example, sending webhook notifications, triggering trades, or logging signals.

## Table of Contents

- [Overview](#overview)
- [alert()](#alert)
- [alertcondition()](#alertcondition)
- [Strategy Order-Fill Alerts](#strategy-order-fill-alerts)
- [Placeholders](#placeholders)
- [Capturing Alerts](#capturing-alerts)
- [Alert Modes](#alert-modes)
- [Complete Examples](#complete-examples)

---

## Overview

| Source                                      | Purpose                                              | Fires when                                  | Event `type`       |
| ------------------------------------------- | ---------------------------------------------------- | ------------------------------------------- | ------------------ |
| `alert(message, freq)`                      | Imperative — fires when the code path executes it    | Code reaches the `alert()` call             | `'alert'`          |
| `alertcondition(condition, title, message)` | Declarative — fires when a boolean condition is true | `condition` evaluates to `true` (indicators) | `'alertcondition'` |
| Strategy order fills                        | Fires when the broker emulator fills an order        | An order fills (strategies)                 | `'order_fill'`     |

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
| `alert.freq_all`                | Every execution of the call triggers                                |
| `alert.freq_once_per_bar`       | Only the **first** execution of the call in a bar triggers (default) |
| `alert.freq_once_per_bar_close` | Only triggers on the bar's **final tick** (when it closes/confirms) |

If no frequency is specified, `alert.freq_once_per_bar` is used. Frequency gating is per call site: each `alert()` call has its own once-per-bar allowance.

`alert()` messages are sent as written: placeholders such as `{{close}}` are not replaced in them (build the message with `str.tostring()` instead).

### In strategies

A strategy runs on the bar's close unless `calc_on_every_tick = true` is set in `strategy()`. Without it, every `alert()` call triggers as `alert.freq_once_per_bar_close`, whatever its `freq` argument, and the event's `freq` field reports that frequency.

---

## alertcondition()

Registers a named alert condition that fires when a boolean expression is true. Unlike `alert()`, it doesn't support frequency gating — it fires once per bar when the condition is met.

`alertcondition()` creates alerts in **indicators only**: a strategy compiles with `alertcondition()` calls, but they emit no events (as on TradingView). Without a `title`, the condition is named `"Alert"`. The `message` may contain [placeholders](#placeholders), replaced with the bar's values when the alert fires.

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
| `title`     | `const string` | No       | Name of the alert condition (default `"Alert"`) |
| `message`   | `const string` | No       | Message included in the alert event, with [placeholders](#placeholders) |

---

## Strategy Order-Fill Alerts

Every order the broker emulator fills in a strategy emits an `'order_fill'` alert event: entries, exits, `strategy.close()` / `strategy.close_all()` closes, `strategy.risk.*` close-outs and margin calls. No code is needed for these events; the order-generating functions only customize them:

| Parameter | Functions | Effect |
| --- | --- | --- |
| `alert_message` | `strategy.entry`, `strategy.order`, `strategy.exit`, `strategy.close`, `strategy.close_all` | Text of the order's fill alert (`{{strategy.order.alert_message}}`). Empty when absent. |
| `alert_profit`, `alert_loss`, `alert_trailing` | `strategy.exit` | Text for the take-profit, stop-loss or trailing-stop leg, overriding `alert_message` for that leg. |
| `disable_alert` | `strategy.entry`, `strategy.order`, `strategy.exit`, `strategy.close`, `strategy.close_all` | When `true` as the order is created, its fill emits no alert. Accepts a series value. |
| `alert_message` | `strategy.risk.max_drawdown`, `max_intraday_loss`, `max_intraday_filled_orders`, `max_cons_loss_days` | Text of the alert of the close-out the rule triggers. |

The event's `message` is rendered from a template, with [placeholders](#placeholders) (including the `strategy.*` ones) replaced at the fill:

- the script's `//@strategy_alert_message` annotation when it has one;
- otherwise the message TradingView's "Create alert" dialog proposes: `<title> (<inputs>): order {{strategy.order.action}} @ {{strategy.order.contracts}} filled on {{ticker}}. New strategy position is {{strategy.position_size}}`, where `<inputs>` are the input values shown in the status line (bool, color, time, text_area and `display.none` inputs are left out; no parentheses when none is shown), e.g. `My Strategy (14, close): order buy @ 1 filled on BTCUSDT. New strategy position is 1`.

The order's own text is always available as the event's `alert_message` field. Placeholders written inside an `alert_message` argument are not expanded, as on TradingView.

```pine
//@version=6
strategy("Webhook strategy", overlay=true)
//@strategy_alert_message {"action": "{{strategy.order.action}}", "qty": {{strategy.order.contracts}}, "note": "{{strategy.order.alert_message}}"}

if ta.crossover(ta.sma(close, 14), ta.sma(close, 28))
    strategy.entry("Long", strategy.long, alert_message = "enter long")
strategy.exit("Exit", "Long", profit = 1000, loss = 500, alert_profit = "take profit", alert_loss = "stop loss")
```

---

## Placeholders

Placeholders are replaced once the bar's script has run, so `{{plot_N}}` and `{{plot("title")}}` give the values plotted on the bar where the alert fired. Numbers are written as plain numbers (TradingView formats `{{close}}` with the symbol's price format, e.g. `80578.00`). A placeholder PineTS does not know is left as written.

| Placeholder | Value | Available in |
| --- | --- | --- |
| `{{open}}`, `{{high}}`, `{{low}}`, `{{close}}`, `{{volume}}` | The bar's values | `alertcondition()` messages, `//@strategy_alert_message` |
| `{{time}}`, `{{timenow}}` | Bar open time / current time, UTC, `yyyy-MM-ddTHH:mm:ssZ` | same |
| `{{ticker}}`, `{{exchange}}`, `{{interval}}` | `syminfo.ticker`, `syminfo.prefix`, `timeframe.period` | same |
| `{{plot_0}}` … `{{plot_N}}` | Value of the Nth plot in order of appearance, counting `plot`, `plotchar`, `plotshape`, `plotarrow` (not `bgcolor` or `alertcondition`); `null` for a plot number the script does not have | same |
| `{{plot("title")}}` | Value of the plot with that title | same |
| `{{strategy.order.action}}` | `buy` or `sell` | `//@strategy_alert_message` |
| `{{strategy.order.contracts}}`, `{{strategy.order.price}}` | Quantity and price of the fill | same |
| `{{strategy.order.id}}`, `{{strategy.order.comment}}` | Order id; comment (the id when the order has none). A `strategy.close()` fill's id is `Close entry(s) order strategy.close_N` (N: the call site, in source order) and its default comment `Close entry(s) order <entry id>`; `strategy.close_all()` fills are `Close position order` | same |
| `{{strategy.order.alert_message}}` | The order's `alert_message` | same |
| `{{strategy.position_size}}` | Position after the fill (signed) | same |
| `{{strategy.market_position}}`, `{{strategy.market_position_size}}` | `long` / `short` / `flat`, and the absolute size, after the fill | same |
| `{{strategy.prev_market_position}}`, `{{strategy.prev_market_position_size}}` | The same, before the fill | same |

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

Each alert event has this shape:

```typescript
{
    type: 'alert' | 'alertcondition' | 'order_fill',
    id: string,               // Call site id (alert_0, alertcondition_0, ...) or order id
    message: string,          // The alert message, placeholders replaced
    title?: string,           // Title (alertcondition only)
    freq?: string,            // Frequency applied (alert only)
    alert_message?: string,   // The order's alert_message (order_fill only)
    order?: {                 // The filled order (order_fill only)
        id: string,
        action: 'buy' | 'sell',
        contracts: number,
        price: number,
        comment: string,      // The order id when the order has no comment
    },
    position_size?: number,      // Position after the fill (order_fill only)
    prev_position_size?: number, // Position before the fill (order_fill only)
    bar_index: number,        // Bar index where the alert fired
    time: number              // Bar open time (ms timestamp)
}
```

---

## Alert Modes

By default, PineTS matches TradingView behavior: alerts only fire on the **last (realtime) bar**. Historical bars are silently skipped. This is the correct behavior for live trading. The mode applies to all three sources: `alert()`, `alertcondition()` and strategy order fills.

With live data (`stream()` with `live: true`, or `updateTail()`), the bar forming when updates begin and every bar after it are realtime bars. When a live bar closes, PineTS executes it once more with its final values before the next bar: that execution is where `alert.freq_once_per_bar_close` alerts (and the `alert()` calls of a strategy without `calc_on_every_tick`) fire. Once-per-bar alerts and `alertcondition()` do not fire a second time for that bar.

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

const code = `
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

const evt = pine.stream(code, { live: true, interval: 10000 });

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
