// SPDX-License-Identifier: AGPL-3.0-only
// Order sizing and fills as on TradingView's broker emulator. Each test checks a rule measured on
// TradingView (BINANCE:BTCUSDT 1h, Pine v6); the quantity sequences of the halving and explicit-qty
// tests are TradingView's exact values. The Mock symbol has syminfo.mincontract 0.00001 and
// syminfo.mintick 0.01, like BINANCE:BTCUSDT.

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

async function run(source: string) {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, Date.UTC(2024, 0, 1), Date.UTC(2024, 0, 12));
    const { plots } = await pineTS.run(source);
    return (title: string): number[] => (plots[title]?.data ?? []).map((d: any) => d.value);
}
const STEP = 0.00001;
const floorQty = (q: number) => Number((Math.floor((q / STEP) * (1 + 1e-10)) * STEP).toFixed(5));
const close5 = (a: number, b: number) => Math.abs(a - b) < 1e-9;
const BARS = `
plot(open, "o")
plot(high, "h")
plot(low, "l")
plot(close, "c")
plot(bar_index, "bi")
`;
const LAST_TRADE = `
n = strategy.closedtrades - 1
plot(n >= 0 ? strategy.closedtrades.entry_price(n) : na, "entry")
plot(n >= 0 ? strategy.closedtrades.entry_bar_index(n) : na, "entry_bar")
plot(n >= 0 ? strategy.closedtrades.exit_price(n) : na, "exit")
plot(n >= 0 ? strategy.closedtrades.exit_bar_index(n) : na, "exit_bar")
plot(n >= 0 ? strategy.closedtrades.size(n) : na, "size")
plot(strategy.closedtrades + 0, "nclosed")
plot(strategy.position_size, "pos")
`;
// Bars where a new closed trade appears.
const closings = (v: (t: string) => number[]) => {
    const n = v('nclosed');
    const out: number[] = [];
    for (let i = 1; i < n.length; i++) if (n[i] > n[i - 1]) out.push(i);
    return out;
};

describe('quantities are floored to syminfo.mincontract (S1)', () => {
    it('sizes percent-of-equity entries on the quantity step and fills 100%-of-equity entries', async () => {
        const v = await run(`//@version=6
strategy("t", initial_capital = 1000000, default_qty_type = strategy.percent_of_equity, default_qty_value = 100)
if bar_index % 24 == 0 and strategy.position_size == 0
    strategy.entry("L", strategy.long)
if bar_index % 24 == 12
    strategy.close("L")
plot(strategy.default_entry_qty(close), "deq")
plot(strategy.equity, "eq")
${BARS}${LAST_TRADE}`);
        const [deq, eq, c, o, bi, pos] = [v('deq'), v('eq'), v('c'), v('o'), v('bi'), v('pos')];
        let entries = 0;
        for (let i = 0; i < deq.length - 1; i++) {
            expect(close5(deq[i], floorQty(eq[i] / c[i]))).toBe(true);
            if (bi[i] % 24 === 0 && pos[i] === 0) {
                // the entry fills on the next bar with the quantity sized at this close, unless the
                // next open makes its notional exceed the equity (margin check)
                expect(pos[i + 1]).toBe(deq[i] * o[i + 1] <= eq[i] ? deq[i] : 0);
                if (pos[i + 1] > 0) entries++;
            }
        }
        expect(entries).toBeGreaterThan(3);
    });

    it('floors partial closes and keeps the remainder (TradingView sequence)', async () => {
        const v = await run(`//@version=6
strategy("t", initial_capital = 1000000, default_qty_type = strategy.fixed, default_qty_value = 1)
if bar_index == 2
    strategy.entry("L", strategy.long)
if bar_index > 3 and bar_index % 4 == 0
    strategy.close("L", qty_percent = 50)
plot(strategy.position_size, "pos")`);
        const pos = v('pos').map((x) => Number(x.toFixed(5)));
        const sizes = pos.filter((x, i) => i === 0 || x !== pos[i - 1]);
        expect(sizes).toEqual([0, 1, 0.5, 0.25, 0.125, 0.0625, 0.03125, 0.01563, 0.00782, 0.00391, 0.00196, 0.00098, 0.00049, 0.00025, 0.00013, 0.00007, 0.00004, 0.00002, 0.00001, 0]);
    });

    it('floors explicit quantities and rejects one below the minimum', async () => {
        const v = await run(`//@version=6
strategy("t", pyramiding = 3, initial_capital = 1000000, default_qty_type = strategy.fixed, default_qty_value = 1)
if bar_index == 10
    strategy.entry("A", strategy.long, qty = 0.00001234567)
if bar_index == 11
    strategy.entry("B", strategy.long, qty = 0.000001)
if bar_index == 12
    strategy.entry("C", strategy.long, qty = 1.99999999)
plot(strategy.position_size, "pos")
plot(strategy.opentrades + 0, "nopen")`);
        const [pos, nopen] = [v('pos'), v('nopen')];
        expect(pos[11]).toBe(0.00001);
        expect(pos[12]).toBe(0.00001);
        expect(nopen[12]).toBe(1);
        expect(close5(pos[13], 2)).toBe(true);
        expect(nopen[13]).toBe(2);
    });

    it('sizes limit entries at the limit price and stop / stop-limit entries at the stop price (S2)', async () => {
        const v = await run(`//@version=6
strategy("t", initial_capital = 1000000, default_qty_type = strategy.percent_of_equity, default_qty_value = 20)
float lim = math.round_to_mintick(close * 0.999)
float stp = math.round_to_mintick(close * 1.001)
if bar_index % 24 == 0 and strategy.position_size == 0
    strategy.entry("LL", strategy.long, limit = lim)
if bar_index % 24 == 8 and strategy.position_size == 0
    strategy.entry("LS", strategy.long, stop = stp)
if bar_index % 24 == 14 and strategy.position_size == 0
    strategy.entry("LSL", strategy.long, stop = stp, limit = math.round_to_mintick(close * 1.003))
if bar_index % 24 == 5 or bar_index % 24 == 13 or bar_index % 24 == 19
    strategy.cancel_all()
if bar_index % 24 == 20 or bar_index % 24 == 6 or bar_index % 24 == 12
    strategy.close_all()
plot(strategy.equity, "eq")
plot(lim, "lim")
plot(stp, "stp")
${BARS}${LAST_TRADE}`);
        const [pos, eq, lim, stp, bi] = [v('pos'), v('eq'), v('lim'), v('stp'), v('bi')];
        let checked = 0;
        for (let i = 1; i < pos.length; i++) {
            if (pos[i - 1] !== 0 || pos[i] <= 0) continue;
            // find the bar that placed the order that just filled
            let k = i - 1;
            while (k > 0 && ![0, 8, 14].includes(bi[k] % 24)) k--;
            const price = bi[k] % 24 === 0 ? lim[k] : stp[k];
            expect(close5(pos[i], floorQty((eq[k] * 0.2) / price))).toBe(true);
            checked++;
        }
        expect(checked).toBeGreaterThan(3);
    });
});

describe('fills (S3)', () => {
    it('applies slippage to market and stop fills only, not to limit fills', async () => {
        const v = await run(`//@version=6
strategy("t", slippage = 20, initial_capital = 1000000, default_qty_type = strategy.fixed, default_qty_value = 1)
var float lim = na
if bar_index % 24 == 0
    strategy.entry("L", strategy.long)
if bar_index % 24 == 6
    strategy.close("L")
if bar_index % 24 == 12 and strategy.position_size == 0
    lim := math.round_to_mintick(close * 0.999)
    strategy.entry("LL", strategy.long, limit = lim)
if bar_index % 24 == 18
    strategy.cancel_all()
    strategy.close_all()
plot(lim, "lim")
${BARS}${LAST_TRADE}`);
        const [entry, entryBar, o, lim] = [v('entry'), v('entry_bar'), v('o'), v('lim')];
        let market = 0;
        let limit = 0;
        for (const i of closings(v)) {
            const b = entryBar[i];
            if (v('bi')[b - 1] % 24 === 0) {
                expect(close5(entry[i], o[b] + 0.2)).toBe(true);
                market++;
            } else {
                expect(close5(entry[i], lim[b - 1])).toBe(true);
                limit++;
            }
        }
        expect(market).toBeGreaterThan(3);
        expect(limit).toBeGreaterThan(0);
    });

    it('fills strategy.close(immediately = true) at the close of the bar it is called on', async () => {
        const v = await run(`//@version=6
strategy("t", initial_capital = 1000000, default_qty_type = strategy.fixed, default_qty_value = 4)
if bar_index % 24 == 0
    strategy.entry("L", strategy.long)
if bar_index % 24 == 8
    strategy.close("L", qty = 1, immediately = true)
if bar_index % 24 == 12
    strategy.close_all()
${BARS}${LAST_TRADE}`);
        const [exit, exitBar, c, bi] = [v('exit'), v('exit_bar'), v('c'), v('bi')];
        let n = 0;
        for (const i of closings(v)) {
            if (bi[exitBar[i]] % 24 !== 8) continue;
            expect(exit[i]).toBe(c[exitBar[i]]);
            expect(v('size')[i]).toBe(1);
            n++;
        }
        expect(n).toBeGreaterThan(3);
    });

    it('fills market orders at the bar close with process_orders_on_close = true', async () => {
        const v = await run(`//@version=6
strategy("t", initial_capital = 1000000, default_qty_type = strategy.fixed, default_qty_value = 1, process_orders_on_close = true)
if bar_index % 24 == 0
    strategy.entry("L", strategy.long)
if bar_index % 24 == 12
    strategy.close("L")
${BARS}${LAST_TRADE}`);
        const [entry, entryBar, exit, exitBar, c, bi] = [v('entry'), v('entry_bar'), v('exit'), v('exit_bar'), v('c'), v('bi')];
        const ix = closings(v);
        expect(ix.length).toBeGreaterThan(3);
        for (const i of ix) {
            expect(bi[entryBar[i]] % 24).toBe(0);
            expect(entry[i]).toBe(c[entryBar[i]]);
            expect(bi[exitBar[i]] % 24).toBe(12);
            expect(exit[i]).toBe(c[exitBar[i]]);
        }
    });

    it('fills an exit stop that is already breached when placed at the next open', async () => {
        const v = await run(`//@version=6
strategy("t", initial_capital = 1000000, default_qty_type = strategy.fixed, default_qty_value = 1)
if bar_index % 24 == 0
    strategy.entry("A", strategy.long)
if bar_index % 24 == 4
    strategy.exit("xs", "A", stop = close * 1.01)
${BARS}${LAST_TRADE}`);
        const [exit, exitBar, o, bi] = [v('exit'), v('exit_bar'), v('o'), v('bi')];
        const ix = closings(v);
        expect(ix.length).toBeGreaterThan(3);
        for (const i of ix) {
            expect(bi[exitBar[i]] % 24).toBe(5);
            expect(exit[i]).toBe(o[exitBar[i]]);
        }
    });

    it('fills stop-limit entries once the stop is reached', async () => {
        const v = await run(`//@version=6
strategy("t", initial_capital = 1000000, default_qty_type = strategy.fixed, default_qty_value = 1)
float stp = math.round_to_mintick(close * 1.002)
if bar_index % 24 == 0 and strategy.position_size == 0
    strategy.entry("LS", strategy.long, stop = stp, limit = math.round_to_mintick(close * 1.003))
if bar_index % 24 == 12
    strategy.cancel_all()
    strategy.close_all()
plot(stp, "stp")
${BARS}${LAST_TRADE}`);
        const [entry, entryBar, o, stp, bi] = [v('entry'), v('entry_bar'), v('o'), v('stp'), v('bi')];
        const ix = closings(v);
        expect(ix.length).toBeGreaterThan(0);
        for (const i of ix) {
            const b = entryBar[i];
            let k = b - 1;
            while (bi[k] % 24 !== 0) k--;
            // the limit is above the stop: it fills where the stop is reached (the open if gapped past it)
            expect(entry[i]).toBe(Math.max(o[b], stp[k]));
        }
    });

    it('takes exit qty_percent of the entry quantity and fills each exit id once per trade', async () => {
        const v = await run(`//@version=6
strategy("t", initial_capital = 1000000, default_qty_type = strategy.fixed, default_qty_value = 8)
if bar_index % 48 == 0 and strategy.position_size == 0
    strategy.entry("L", strategy.long)
if strategy.position_size > 0
    strategy.exit("t1", "L", qty_percent = 25, profit = 5000, loss = 1000000)
    strategy.exit("t2", "L", qty_percent = 25, profit = 10000, loss = 1000000)
    strategy.exit("t3", "L", profit = 1000000, loss = 1000000)
if bar_index % 48 == 46
    strategy.close_all()
plot(strategy.position_size, "pos")`);
        const pos = v('pos');
        // each 25% exit closes 2 of the 8 entry contracts, once: 8 -> 6 -> 4, never 4.5 or 3
        const seen = new Set(pos);
        expect(seen.has(8)).toBe(true);
        expect(seen.has(6)).toBe(true);
        expect(seen.has(4)).toBe(true);
        for (const p of seen) expect([0, 4, 6, 8]).toContain(p);
    });

    it('needs price past a limit by backtest_fill_limits_assumption ticks', async () => {
        const src = (extra: string) => `//@version=6
strategy("t", initial_capital = 1000000, default_qty_type = strategy.fixed, default_qty_value = 1${extra})
var float lim = na
if bar_index % 6 == 0 and strategy.position_size == 0
    lim := math.round_to_mintick(close - 60)
    strategy.entry("L", strategy.long, limit = lim)
if bar_index % 6 == 5
    strategy.cancel("L")
    strategy.close_all()
plot(lim, "lim")
${BARS}${LAST_TRADE}`;
        const off = await run(src(''));
        const on = await run(src(', backtest_fill_limits_assumption = 3000'));
        const [lim, l, o, pos] = [on('lim'), on('l'), on('o'), on('pos')];
        for (let i = 1; i < pos.length; i++) {
            if (on('bi')[i] % 6 === 0 || on('bi')[i] % 6 === 5) continue;
            const filledHere = pos[i - 1] === 0 && pos[i] === 1;
            if (filledHere) expect(l[i]).toBeLessThanOrEqual(lim[i] - 30);
            if (pos[i - 1] === 0 && pos[i] === 0 && !Number.isNaN(lim[i])) expect(l[i] > lim[i] - 30 || o[i] < lim[i]).toBe(true);
        }
        expect(on('nclosed').at(-1)).toBeLessThan(off('nclosed').at(-1)!);
    });

    it('replaces an entry still pending from an earlier bar when the same id is placed again', async () => {
        const v = await run(`//@version=6
strategy("t", initial_capital = 1000000, default_qty_type = strategy.fixed, default_qty_value = 1)
var float first = na
if bar_index == 5
    first := close * 0.995
    strategy.entry("L", strategy.long, limit = first)
if bar_index == 6
    strategy.entry("L", strategy.long, limit = close * 0.5)
plot(first, "first")
plot(ta.lowest(low, 200), "lowest")
plot(strategy.opentrades + strategy.closedtrades, "trades")`);
        // price went below the first limit later on, yet that order no longer exists
        expect(v('lowest').at(-1)!).toBeLessThan(v('first').at(-1)!);
        expect(v('trades').at(-1)).toBe(0);
    });
});

describe('generated exit ids', () => {
    it('names exits of strategy.close and strategy.close_all as TradingView does', async () => {
        const v = await run(`//@version=6
strategy("t", initial_capital = 1000000, default_qty_type = strategy.fixed, default_qty_value = 1)
if bar_index % 24 == 0
    strategy.entry("L", strategy.long)
if bar_index % 24 == 6
    strategy.close("L")
if bar_index % 24 == 12
    strategy.entry("S", strategy.short)
if bar_index % 24 == 18
    strategy.close_all()
n = strategy.closedtrades - 1
plot(n >= 0 ? (strategy.closedtrades.exit_id(n) == "Close entry(s) order L" ? 1 : strategy.closedtrades.exit_id(n) == "Close position order" ? 2 : -1) : 0, "id")`);
        const ids = new Set(v('id'));
        expect(ids.has(1)).toBe(true);
        expect(ids.has(2)).toBe(true);
        expect(ids.has(-1)).toBe(false);
    });
});
