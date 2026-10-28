// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Alerts at the close of a live bar.
 *
 * Pine User Manual (Alerts): alert.freq_once_per_bar_close "is only triggered when the realtime bar closes and an
 * alert() call is executed during that script iteration", and a strategy without calc_on_every_tick triggers all
 * its alert() calls that way. When live data closes the forming bar, PineTS executes that bar once more with its
 * final values before the next one: that execution must fire them, once, with the closed bar's values.
 */

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';

const MIN = 60_000;

// Bars 0..9, bar 9 still forming. Update 1: a tick on bar 9. Update 2: bar 9 closes at 111, bar 10 opens.
// Later updates: ticks on bar 10.
function liveProvider() {
    const t0 = Math.floor(Date.now() / MIN) * MIN - 9 * MIN;
    const bar = (i: number, close: number, closed: boolean) => ({
        open: 100 + i,
        high: 102 + i,
        low: 99 + i,
        close,
        volume: 1,
        openTime: t0 + i * MIN,
        closeTime: closed ? Math.min(t0 + (i + 1) * MIN - 1, Date.now() - 1) : t0 + (i + 1) * MIN + 10 * MIN,
    });
    let updates = 0;
    return {
        getMarketData: async (_t: string, _tf: string, _l?: number, sDate?: number) => {
            if (sDate === undefined) return Array.from({ length: 10 }, (_, i) => bar(i, 101 + i, i < 9));
            updates++;
            if (updates === 1) return [bar(9, 110.5, false)];
            if (updates === 2) return [bar(9, 111, true), bar(10, 111, false)];
            return [bar(10, 111 + updates * 0.1, false)];
        },
        getSymbolInfo: async () => null,
    };
}

const brief = (alerts: any[]) => alerts.map((a) => ({ type: a.type, message: a.message, bar: a.bar_index }));

describe('alerts at the close of a live bar (updateTail)', () => {
    async function runWithUpdates(code: string) {
        const pine = new PineTS(liveProvider() as any, 'TEST', '1');
        await pine.ready();
        const ctx: any = await pine.run(code);
        const beforeClose = brief(ctx.alerts);
        expect(await pine.updateTail(ctx)).toBe(true); // tick on the forming bar
        expect(await pine.updateTail(ctx)).toBe(true); // the bar closes, the next opens
        return { beforeClose, all: brief(ctx.alerts) };
    }

    it('alert.freq_once_per_bar_close fires once, on the closed bar, with its final values', async () => {
        const { beforeClose, all } = await runWithUpdates(`//@version=6
indicator("close freq")
alert("c " + str.tostring(close), alert.freq_once_per_bar_close)
plot(close)
`);
        expect(beforeClose).toEqual([]);
        expect(all).toEqual([{ type: 'alert', message: 'c 111', bar: 9 }]);
    });

    it('alert() in a strategy fires once at the bar close', async () => {
        const { all } = await runWithUpdates(`//@version=6
strategy("strategy alert")
alert("s " + str.tostring(close), alert.freq_all)
`);
        expect(all).toEqual([{ type: 'alert', message: 's 111', bar: 9 }]);
    });

    it('once-per-bar alerts and alertcondition() do not fire again when the closed bar is executed', async () => {
        const { all } = await runWithUpdates(`//@version=6
indicator("once per bar")
alert("o " + str.tostring(close), alert.freq_once_per_bar)
alertcondition(true, "T", "cond")
plot(close)
`);
        expect(all.filter((a) => a.bar === 9)).toEqual([
            { type: 'alert', message: 'o 110', bar: 9 },
            { type: 'alertcondition', message: 'cond', bar: 9 },
        ]);
        expect(all.filter((a) => a.bar === 10).map((a) => a.type)).toEqual(['alert', 'alertcondition']);
    });

    // TradingView (live, process_orders_on_close): the fill and its alert come at the bar close (+60 s), not on the
    // bar's first tick; a strategy without calc_on_every_tick runs on the live bar only when it closes.
    it('process_orders_on_close fills a live bar order at its close, not on its ticks', async () => {
        const pine = new PineTS(liveProvider() as any, 'TEST', '1');
        await pine.ready();
        const ctx: any = await pine.run(`//@version=6
strategy("poc", process_orders_on_close = true, initial_capital = 1000000)
//@strategy_alert_message {{strategy.order.action}} {{strategy.order.price}} {{strategy.order.alert_message}}
if bar_index == 9
    strategy.entry("L", strategy.long, qty = 1, alert_message = "in")
`);
        const fills = () => brief(ctx.alerts.filter((a: any) => a.type === 'order_fill'));
        expect(fills()).toEqual([]);
        expect(ctx.strategy.opentrades.length).toBe(0);
        expect(await pine.updateTail(ctx)).toBe(true); // tick on the forming bar
        expect(fills()).toEqual([]);
        expect(ctx.strategy.opentrades.length).toBe(0);
        expect(await pine.updateTail(ctx)).toBe(true); // the bar closes
        expect(fills()).toEqual([{ type: 'order_fill', message: 'buy 111 in', bar: 9 }]);
        expect(ctx.strategy.opentrades.length).toBe(1);
        expect(ctx.strategy.opentrades[0].entry_price).toBe(111);
    });

    it('historical bars still fire nothing in realtime mode', async () => {
        const { all } = await runWithUpdates(`//@version=6
indicator("history")
if bar_index < 9
    alert("h", alert.freq_all)
plot(close)
`);
        expect(all).toEqual([]);
    });
});

describe('alerts at the close of a live bar (stream)', () => {
    it('stream() emits the bar-close alert of the bar that closed', async () => {
        const pine = new PineTS(liveProvider() as any, 'TEST', '1');
        await pine.ready();
        const alerts: any[] = [];
        await new Promise<void>((resolve, reject) => {
            const s = pine.stream(`//@version=6\nindicator("stream close")\nalert("c " + str.tostring(close), alert.freq_once_per_bar_close)\nplot(close)\n`, {
                live: true,
                interval: 200,
            });
            s.on('alert', (a: any) => alerts.push(a));
            s.on('error', reject);
            setTimeout(() => {
                s.stop();
                resolve();
            }, 2500);
        });
        expect(brief(alerts)).toEqual([{ type: 'alert', message: 'c 111', bar: 9 }]);
    }, 10_000);
});
