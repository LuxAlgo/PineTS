// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Strategy order-fill alerts and the alert functions inside strategies.
 *
 * Expected behavior (Pine reference manual, Pine User Manual "Alerts", TradingView Help Center
 * "Strategy alerts"):
 * - Every order fill of the broker emulator triggers an alert, on realtime bars only.
 * - `alert_message` replaces `{{strategy.order.alert_message}}` in the alert's message (empty when
 *   absent); placeholders inside `alert_message` itself are not expanded.
 * - `disable_alert = true` when the order is created silences that order's fill alert.
 * - strategy.exit: alert_profit / alert_loss / alert_trailing apply to their leg, overriding
 *   alert_message.
 * - strategy.risk.* rules: their alert_message is the message of the close-out's alert.
 * - `//@strategy_alert_message` is the default message of the order-fill alerts.
 * - alertcondition() in a strategy creates no alert; alert() in a strategy triggers as
 *   alert.freq_once_per_bar_close unless calc_on_every_tick = true.
 */

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

const start = new Date('2024-01-01').getTime();
const end = new Date('2024-02-15').getTime();

async function runAll(code: string, from = start, to = end) {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, from, to);
    pineTS.setAlertMode('all');
    const ctx: any = await pineTS.run(code);
    return { ctx, fills: ctx.alerts.filter((a: any) => a.type === 'order_fill') };
}

describe('Strategy order-fill alerts', () => {
    it('alerts each fill with its alert_message, matching the trade ledger', async () => {
        const { ctx, fills } = await runAll(`//@version=6
strategy("fills")
if bar_index % 4 == 0
    strategy.entry("L", strategy.long, qty = 2, alert_message = "enter " + str.tostring(bar_index))
if bar_index % 4 == 2
    strategy.close("L", comment = "done", alert_message = "exit")
`);
        const trades = ctx.strategy.closedtrades;
        expect(trades.length).toBeGreaterThan(3);
        const entries = fills.filter((a: any) => a.order.action === 'buy');
        const exits = fills.filter((a: any) => a.order.action === 'sell');
        expect(entries.length).toBe(trades.length + ctx.strategy.opentrades.length);
        expect(exits.length).toBe(trades.length);

        trades.forEach((t: any, i: number) => {
            const e = entries[i];
            // The entry is placed on bar 4k and fills at the next bar's open, where the message was set.
            expect(e).toMatchObject({ id: 'L', alert_message: `enter ${t.entry_bar_index - 1}`, bar_index: t.entry_bar_index });
            expect(e.message).toBe('fills: order buy @ 2 filled on BTCUSDC. New strategy position is 2');
            expect(e.order).toMatchObject({ id: 'L', action: 'buy', contracts: 2, price: t.entry_price, comment: 'L' });
            expect(e.prev_position_size).toBe(0);
            expect(e.position_size).toBe(2);

            const x = exits[i];
            expect(x).toMatchObject({ alert_message: 'exit', bar_index: t.exit_bar_index });
            expect(x.message).toBe('fills: order sell @ 2 filled on BTCUSDC. New strategy position is 0');
            expect(x.order).toMatchObject({ id: 'Close entry(s) order strategy.close_0', action: 'sell', contracts: 2, price: t.exit_price, comment: 'done' });
            expect(x.prev_position_size).toBe(2);
            expect(x.position_size).toBe(0);
        });
    });

    it('fills without alert_message have an empty alert_message', async () => {
        const { fills } = await runAll(`//@version=6
strategy("no msg")
if bar_index % 4 == 0
    strategy.entry("L", strategy.long, qty = 1)
if bar_index % 4 == 2
    strategy.close_all()
`);
        expect(fills.length).toBeGreaterThan(0);
        expect(fills.every((a: any) => a.alert_message === '')).toBe(true);
    });

    // The message TradingView's "Create alert" dialog proposed for this script (captured on TradingView): the
    // title (not the short title), then the status-line input values; bool, color and display.none inputs are left out.
    it('without //@strategy_alert_message the message is the dialog default with the status-line inputs', async () => {
        const { fills } = await runAll(`//@version=6
strategy("tvx dlg inputs", shorttitle = "TDI", overlay = true)
i1 = input.int(14, "Len")
f1 = input.float(1.5, "Mult")
b1 = input.bool(true, "Flag")
b2 = input.bool(false, "Off")
s1 = input.string("abc", "Str")
src = input.source(close, "Src")
c1 = input.color(color.red, "Col")
tf = input.timeframe("60", "TF")
hid = input.int(7, "Hidden", display = display.none)
sym = input.symbol("BINANCE:ETHUSDT", "Sym")
if bar_index == 2
    strategy.entry("L", strategy.long, qty = 1)
`);
        expect(fills.map((a: any) => a.message)).toEqual([
            'tvx dlg inputs (14, 1.5, abc, close, 60, ETHUSDT · Binance): order buy @ 1 filled on BTCUSDC. New strategy position is 1',
        ]);
    });

    it('the default message has no parentheses when no input is shown in the status line', async () => {
        const { fills } = await runAll(`//@version=6
strategy("tvx dlg plain", overlay = true)
flag = input.bool(true, "Flag")
if bar_index == 2
    strategy.entry("S", strategy.short, qty = 3)
`);
        expect(fills.map((a: any) => a.message)).toEqual(['tvx dlg plain: order sell @ 3 filled on BTCUSDC. New strategy position is -3']);
    });

    it('disable_alert silences the fills of the orders created with it (series value)', async () => {
        const { ctx, fills } = await runAll(`//@version=6
strategy("disable")
if bar_index % 4 == 0
    strategy.entry("L", strategy.long, qty = 1, alert_message = "in", disable_alert = bar_index % 8 == 0)
if bar_index % 4 == 2
    strategy.close("L", alert_message = "out", disable_alert = true)
`);
        const entryBars = [...ctx.strategy.closedtrades, ...ctx.strategy.opentrades].map((t: any) => t.entry_bar_index);
        // Placed on bar 4k, filled on 4k + 1: silenced when 4k is a multiple of 8.
        const alerted = entryBars.filter((b: number) => (b - 1) % 8 !== 0);
        expect(alerted.length).toBeGreaterThan(0);
        expect(alerted.length).toBeLessThan(entryBars.length);
        expect(fills.map((a: any) => a.bar_index)).toEqual(alerted);
        expect(fills.every((a: any) => a.alert_message === 'in')).toBe(true);
    });

    it('strategy.order and strategy.close_all carry their alert_message', async () => {
        const { fills } = await runAll(`//@version=6
strategy("order")
if bar_index == 3
    strategy.order("O", strategy.short, qty = 3, alert_message = "short 3")
if bar_index == 6
    strategy.close_all(alert_message = "flatten")
`);
        expect(fills.map((a: any) => [a.bar_index, a.order.action, a.order.contracts, a.alert_message])).toEqual([
            [4, 'sell', 3, 'short 3'],
            [7, 'buy', 3, 'flatten'],
        ]);
        expect(fills[0].position_size).toBe(-3);
        expect(fills[1].prev_position_size).toBe(-3);
    });

    it('strategy.exit legs use alert_profit / alert_loss over alert_message, and comment_* as the order comment', async () => {
        const { ctx, fills } = await runAll(
            `//@version=6
strategy("legs")
if strategy.position_size == 0 and bar_index % 5 == 0
    strategy.entry("L", strategy.long, qty = 1, alert_message = "entry")
strategy.exit("X", "L", profit = 100000, loss = 100000, alert_message = "generic", alert_profit = "tp", comment_loss = "SL!")
`,
            start,
            new Date('2024-04-01').getTime(),
        );
        const trades = ctx.strategy.closedtrades;
        const exits = fills.filter((a: any) => a.id === 'X');
        expect(exits.length).toBe(trades.length);
        // mintick 0.01: 100000 ticks = 1000 from the entry price
        const tp = trades.filter((t: any) => Math.abs(t.exit_price - (t.entry_price + 1000)) < 1e-6);
        const sl = trades.filter((t: any) => Math.abs(t.exit_price - (t.entry_price - 1000)) < 1e-6);
        expect(tp.length).toBeGreaterThan(0);
        expect(sl.length).toBeGreaterThan(0);
        expect(tp.length + sl.length).toBe(trades.length);
        trades.forEach((t: any, i: number) => {
            const isTp = tp.includes(t);
            expect(exits[i].order.price).toBe(t.exit_price);
            expect(exits[i].alert_message).toBe(isTp ? 'tp' : 'generic');
            // Without a comment the order comment is the order id (Help Center, strategy.order.comment).
            expect(exits[i].order.comment).toBe(isTp ? 'X' : 'SL!');
        });
    });

    it('a strategy.risk rule close-out alerts with the rule alert_message', async () => {
        const { ctx, fills } = await runAll(
            `//@version=6
strategy("risk")
strategy.risk.max_drawdown(1, strategy.cash, alert_message = "dd hit")
if bar_index % 3 == 0
    strategy.entry("L", strategy.long, qty = 1)
if bar_index % 3 == 1
    strategy.entry("S", strategy.short, qty = 1)
`,
            start,
            new Date('2024-06-01').getTime(),
        );
        const closeOut = ctx.strategy.closedtrades.find((t: any) => t.exit_id === 'Close Position (Max Drawdown)');
        expect(closeOut).toBeDefined();
        const riskFills = fills.filter((a: any) => a.id === 'Close Position (Max Drawdown)');
        expect(riskFills.length).toBe(1);
        expect(riskFills[0]).toMatchObject({ alert_message: 'dd hit', bar_index: closeOut.exit_bar_index, position_size: 0 });
        expect(riskFills[0].order.price).toBe(closeOut.exit_price);
    });

    it('//@strategy_alert_message is the message, with the placeholders replaced', async () => {
        const { ctx, fills } = await runAll(`//@version=6
strategy("template")
//@strategy_alert_message {{strategy.order.action}} {{strategy.order.contracts}} {{ticker}} @ {{strategy.order.price}} [{{strategy.order.id}}/{{strategy.order.comment}}] {{strategy.order.alert_message}} {{strategy.prev_market_position}}({{strategy.prev_market_position_size}})->{{strategy.market_position}}({{strategy.market_position_size}}) size={{strategy.position_size}} close={{close}} {{unknown}}
if bar_index == 2
    strategy.entry("S", strategy.short, qty = 2, alert_message = "raw {{close}}")
if bar_index == 5
    strategy.close("S", comment = "bye")
`);
        const t = ctx.strategy.closedtrades[0];
        const bar = (i: number) => ctx.marketData[i];
        expect(fills.map((a: any) => a.message)).toEqual([
            `sell 2 BTCUSDC @ ${t.entry_price} [S/S] raw {{close}} flat(0)->short(2) size=-2 close=${bar(3).close} {{unknown}}`,
            `buy 2 BTCUSDC @ ${t.exit_price} [Close entry(s) order strategy.close_0/bye]  short(2)->flat(0) size=0 close=${bar(6).close} {{unknown}}`,
        ]);
        // The raw alert_message stays available
        expect(fills[0].alert_message).toBe('raw {{close}}');
    });

    // Captured on TradingView (order-fill alerts): a strategy.close fill reports the order id
    // `Close entry(s) order strategy.close_N`, N the call site in source order, and its exit id
    // (`Close entry(s) order <entry>`) as the comment unless a comment is given.
    it('strategy.close fills report the call-site order id', async () => {
        const { fills } = await runAll(`//@version=6
strategy("close ids", pyramiding = 2, initial_capital = 1000000)
//@strategy_alert_message {{strategy.order.id}}|{{strategy.order.comment}}|{{strategy.order.contracts}}|{{strategy.order.action}}
m = bar_index % 6
if m == 0 or m == 3
    strategy.entry("A", strategy.long, qty = 0.001)
    strategy.entry("B", strategy.long, qty = 0.002)
if m == 1
    strategy.close("B")
if m == 2
    strategy.close("A")
if m == 4
    strategy.close("A")
    strategy.close("B", comment = "cb")
`);
        const closes = fills.filter((a: any) => a.order.action === 'sell').slice(0, 4).map((a: any) => a.message);
        expect(closes).toEqual([
            'Close entry(s) order strategy.close_0|Close entry(s) order B|0.002|sell',
            'Close entry(s) order strategy.close_1|Close entry(s) order A|0.001|sell',
            'Close entry(s) order strategy.close_2|Close entry(s) order A|0.001|sell',
            'Close entry(s) order strategy.close_3|cb|0.002|sell',
        ]);
    });

    it('fires on the realtime bar only by default', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, start, end);
        const ctx: any = await pineTS.run(`//@version=6
strategy("realtime", pyramiding = 2)
if bar_index == 2 or bar_index == last_bar_index - 1
    strategy.entry(bar_index == 2 ? "early" : "late", strategy.long, qty = 1, alert_message = "fill")
`);
        const last = ctx.marketData.length - 1;
        expect(ctx.strategy.opentrades.length).toBe(2);
        const fills = ctx.alerts.filter((a: any) => a.type === 'order_fill');
        expect(fills.map((a: any) => [a.id, a.bar_index])).toEqual([['late', last]]);
    });

    it('a live-bar re-execution does not alert the same fill twice', async () => {
        const base = 1_700_000_000_000;
        const candles = Array.from({ length: 10 }, (_, i) => ({
            open: 100 + i,
            high: 102 + i,
            low: 98 + i,
            close: 101 + i,
            volume: 1000,
            openTime: base + i * 60_000,
            closeTime: base + i * 60_000 + 59_999,
        }));
        const lastOpen = candles[9].openTime;
        const provider = {
            getMarketData: async (_t: string, _tf: string, _l?: number, sDate?: number) =>
                sDate !== undefined && sDate >= lastOpen ? [{ ...candles[9], close: candles[9].close + 0.5 }] : candles,
            getSymbolInfo: async () => null,
        };
        const pine = new PineTS(provider as any, 'TEST', '1');
        await pine.ready();
        const ctx: any = await pine.run(`//@version=6
strategy("tick")
if bar_index == 8
    strategy.entry("L", strategy.long, qty = 1, alert_message = "go")
`);
        const fillsOf = () => ctx.alerts.filter((a: any) => a.type === 'order_fill');
        expect(fillsOf().map((a: any) => [a.alert_message, a.bar_index])).toEqual([['go', 9]]);

        expect(await pine.updateTail(ctx)).toBe(true);
        expect(ctx.strategy.opentrades.length).toBe(1);
        expect(fillsOf().length).toBe(1);
    });
});

describe('alert() and alertcondition() in strategies', () => {
    it('alertcondition() creates no alert in a strategy', async () => {
        const { ctx } = await runAll(`//@version=6
strategy("ac")
alertcondition(true, "Always", "msg")
`);
        expect(ctx.alerts.length).toBe(0);
    });

    it('alert() triggers as freq_once_per_bar_close without calc_on_every_tick', async () => {
        const { ctx } = await runAll(`//@version=6
strategy("a")
alert("x", alert.freq_all)
alert("y", alert.freq_once_per_bar)
`);
        expect(ctx.alerts.length).toBe(ctx.marketData.length * 2);
        expect(ctx.alerts.every((a: any) => a.freq === 'once_per_bar_close')).toBe(true);
    });

    it('alert() keeps its frequency with calc_on_every_tick = true', async () => {
        const { ctx } = await runAll(`//@version=6
strategy("a", calc_on_every_tick = true)
alert("x", alert.freq_all)
alert("y")
`);
        expect(ctx.alerts.filter((a: any) => a.message === 'x').every((a: any) => a.freq === 'all')).toBe(true);
        expect(ctx.alerts.filter((a: any) => a.message === 'y').every((a: any) => a.freq === 'once_per_bar')).toBe(true);
    });
});

describe('alertcondition() messages and titles', () => {
    it('replaces the placeholders with the values of the bar', async () => {
        const { ctx } = await runAll(
            `//@version=6
indicator("ph")
alertcondition(true, "P", 'c={{close}} o={{open}} p0={{plot_0}} two={{plot("Two")}} t={{time}} tk={{ticker}} keep={{nope}}')
plot(close + 1, "One")
plot(close * 2, "Two")
`,
            start,
            new Date('2024-01-06').getTime(),
        );
        expect(ctx.alerts.length).toBe(ctx.marketData.length);
        ctx.alerts.forEach((a: any, i: number) => {
            const b = ctx.marketData[i];
            const iso = new Date(b.openTime).toISOString().replace('.000Z', 'Z');
            expect(a.title).toBe('P');
            expect(a.message).toBe(`c=${b.close} o=${b.open} p0=${b.close + 1} two=${b.close * 2} t=${iso} tk=BTCUSDC keep={{nope}}`);
        });
    });

    // Layout and numbering captured on TradingView: bgcolor() and alertcondition() take no plot number, plotchar()
    // does, and a plot number the script does not have is written "null".
    it('numbers {{plot_N}} as TradingView does', async () => {
        const { ctx } = await runAll(
            `//@version=6
indicator("plot numbers", overlay = true)
alertcondition(close < 0, "Early", "never")
bgcolor(color.new(color.blue, 90))
plot(close + 1, "One")
plotchar(close * 3, "Char", "x")
plot(close * 2, "Twice")
alertcondition(true, "Main", 'p0={{plot_0}} p1={{plot_1}} p2={{plot_2}} p3={{plot_3}}')
`,
            start,
            new Date('2024-01-04').getTime(),
        );
        const main = ctx.alerts.filter((a: any) => a.title === 'Main');
        expect(main.length).toBe(ctx.marketData.length);
        main.forEach((a: any, i: number) => {
            const c = ctx.marketData[i].close;
            const n = (v: number) => String(Math.round(v * 1e10) / 1e10);
            expect(a.message).toBe(`p0=${n(c + 1)} p1=${n(c * 3)} p2=${n(c * 2)} p3=null`);
        });
    });

    it('names a condition without a title "Alert"', async () => {
        const { ctx } = await runAll(
            `//@version=6
indicator("t")
alertcondition(close > 0)
`,
            start,
            new Date('2024-01-04').getTime(),
        );
        expect(ctx.alerts.length).toBeGreaterThan(0);
        expect(ctx.alerts.every((a: any) => a.title === 'Alert' && a.message === '')).toBe(true);
    });
});
