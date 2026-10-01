// SPDX-License-Identifier: AGPL-3.0-only

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

// A built-in series (`bar_index`, `time`, `high`, …) handed to a callee must arrive as its
// current value. Every expected relation below was checked on TradingView (BINANCE:BTCUSDT 1h)
// with the same scripts.

const H = 3600_000;
const header = (extra = '') => `//@version=6\nindicator("t"${extra})\nevery(n) => (time / 3600000) % n == 0\nsrc = close > open ? high : low\nplot(src, "src")\n`;

async function run(body: string, extra = '') {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-08').getTime());
    const { plots } = await pineTS.run(header(extra) + body);
    const series = (title: string) => plots[title].data.map((d: any) => d.value);
    const time: number[] = plots['src'].data.map((d: any) => d.time);
    return { series, time };
}

// Bars from the first `every(n)` bar on, with the index of the latest `every(n)` bar.
function sinceMark(time: number[], n: number) {
    const out: { i: number; mark: number }[] = [];
    let mark = -1;
    time.forEach((t, i) => {
        if ((t / H) % n === 0) mark = i;
        if (mark >= 0) out.push({ i, mark });
    });
    return out;
}

describe('series arguments are passed by value', () => {
    it('UDT .new() named arguments in a declaration keep the creation bar values (item 12)', async () => {
        const { series, time } = await run(`type Setup
    int bar
    float price
    int t
make() =>
    Setup s = Setup.new(
       bar   = bar_index
     , price = close > open ? high : low
     , t     = time)
    s
var Setup last = na
if every(10)
    last := make()
plot(na(last) ? na : bar_index - last.bar, "age")
plot(na(last) ? na : last.price, "price")
plot(na(last) ? na : (time - last.t) / 3600000, "hours")`);
        const [age, price, hours, src] = ['age', 'price', 'hours', 'src'].map(series);
        const bars = sinceMark(time, 10);
        expect(bars.length).toBeGreaterThan(100);
        for (const { i, mark } of bars) {
            expect(age[i]).toBe(i - mark);
            expect(hours[i]).toBe(i - mark);
            expect(price[i]).toBe(src[mark]);
        }
    });

    it('UDT .new() named arguments in a global declaration hold the current values (item 12)', async () => {
        const { series } = await run(`type Setup
    int bar
    float price
s = Setup.new(bar = bar_index, price = close > open ? high : low)
plot(s.bar - bar_index, "bar delta")
plot(s.price - (close > open ? high : low), "price delta")`);
        expect(series('bar delta').every((v: number) => v === 0)).toBe(true);
        expect(series('price delta').every((v: number) => v === 0)).toBe(true);
    });

    it.each([
        ['line.new(x1 = time, …, x2 = time)', 'max_lines_count = 500', 'var line d = na\nif every(10)\n    d := line.new(x1 = time, y1 = close, x2 = time, y2 = close, xloc = xloc.bar_time)\nplot(na(d) ? na : (time - d.get_x2()) / 3600000, "age")\nplot(na(d) ? na : (time - d.get_x1()) / 3600000, "age2")'],
        ['box.new(left = time, …, right = time)', 'max_boxes_count = 500', 'var box d = na\nif every(10)\n    d := box.new(left = time, top = high, right = time, bottom = low, xloc = xloc.bar_time)\nplot(na(d) ? na : (time - d.get_right()) / 3600000, "age")\nplot(na(d) ? na : (time - d.get_left()) / 3600000, "age2")'],
        ['label.new(x = time, …)', 'max_labels_count = 500', 'var label d = na\nif every(10)\n    d := label.new(x = time, y = close, xloc = xloc.bar_time, text = "x")\nplot(na(d) ? na : (time - d.get_x()) / 3600000, "age")\nplot(na(d) ? na : (time - d.get_x()) / 3600000, "age2")'],
    ])('%s named time argument keeps the creation bar time (item 23)', async (_name, extra, body) => {
        const { series, time } = await run(body, `, ${extra}`);
        const [age, age2] = ['age', 'age2'].map(series);
        for (const { i, mark } of sinceMark(time, 10)) {
            expect(age[i]).toBe(i - mark);
            expect(age2[i]).toBe(i - mark);
        }
    });

    it('history of a dual-use built-in passed to a function is its value N bars back (item 23)', async () => {
        const { series, time } = await run(`f(int t) => t
g(int t) =>
    line.new(x1 = t, y1 = close, x2 = t, y2 = close, xloc = xloc.bar_time)
var line l = na
if every(10)
    l := g(time[1])
plot(f(time[1]) - time, "dt")
plot(f(hour[1]) - hour, "dh")
plot(na(l) ? na : (time - l.get_x1()) / 3600000, "age")`, ', max_lines_count = 500');
        const [dt, dh, age] = ['dt', 'dh', 'age'].map(series);
        for (let i = 1; i < time.length; i++) {
            expect(dt[i]).toBe(-H);
            expect(dh[i]).toBe(new Date(time[i - 1]).getUTCHours() - new Date(time[i]).getUTCHours());
        }
        for (const { i, mark } of sinceMark(time, 10)) if (mark > 0) expect(age[i]).toBe(i - mark + 1);
    });

    it('dual-use built-ins as request.security tuple elements (item 23)', async () => {
        const { series, time } = await run(`[t1, t2, h] = request.security(syminfo.tickerid, "240", [time, time_close, hour], lookahead = barmerge.lookahead_on)
plot((time - t1) / 3600000, "since open")
plot((t2 - t1) / 3600000, "length")
plot(h, "hour")`);
        const [since, length, hour] = ['since open', 'length', 'hour'].map(series);
        time.forEach((t, i) => {
            const open4h = Math.floor(t / (4 * H)) * 4 * H;
            expect(since[i]).toBe((t - open4h) / H);
            expect(length[i]).toBe(4);
            expect(hour[i]).toBe(new Date(open4h).getUTCHours());
        });
    });

    it('method push / set with a ternary argument store the value (item 22a)', async () => {
        const { series, time } = await run(`var a = array.new_float()
a.push(close > open ? high : low)
plot(a.get(a.size() - 1), "last")
plot(a.size() > 1 ? a.get(a.size() - 2) : na, "prev")
var b = array.new_float(3, 0.0)
if every(5)
    b.set(0, close > open ? high : low)
plot(b.get(0), "slot")`);
        const [last, prev, slot, src] = ['last', 'prev', 'slot', 'src'].map(series);
        src.forEach((v: number, i: number) => {
            expect(last[i]).toBe(v);
            if (i > 0) expect(prev[i]).toBe(src[i - 1]);
        });
        for (const { i, mark } of sinceMark(time, 5)) expect(slot[i]).toBe(src[mark]);
    });

    it('request.security tuple elements with a ternary equal the same expressions requested alone (K7)', async () => {
        const { series } = await run(`[c, d] = request.security(syminfo.tickerid, "240", [close, close > open ? 1 : 0])
d2 = request.security(syminfo.tickerid, "240", close > open ? 1 : 0)
[e, f] = request.security(syminfo.tickerid, "240", [ta.sma(close, 3), close > open ? high - low : low - high])
e2 = request.security(syminfo.tickerid, "240", ta.sma(close, 3))
f2 = request.security(syminfo.tickerid, "240", close > open ? high - low : low - high)
c2 = request.security(syminfo.tickerid, "240", close)
plot(c - c2, "c delta")
plot(d - d2, "d delta")
plot(e - e2, "e delta")
plot(f - f2, "f delta")
plot(d, "d")`);
        const settled = (title: string) => series(title).slice(12);
        for (const title of ['c delta', 'd delta', 'e delta', 'f delta']) {
            expect(settled(title).every((v: number) => v === 0), title).toBe(true);
        }
        const d = settled('d');
        expect(d.every((v: number) => v === 0 || v === 1)).toBe(true);
        expect(new Set(d).size).toBe(2);
    });
});
