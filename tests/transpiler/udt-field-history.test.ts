// SPDX-License-Identifier: AGPL-3.0-only
// UDT field history `b.c[N]` (Pine v5; v6 rejects the form and asks for `(b[N]).c`).
//
// Measured on TradingView (v5, BINANCE:BTCUSDT 1h): the field's history is taken where the
// top-level statement containing the read runs, every time its scope runs:
//   - a read inside an `if` is the field on the previous bar, not at the block's previous execution;
//   - a read placed before `b.c := close` is close[2] (the field as the statement saw it last bar);
//   - a block that sets the field then reads it sees last bar's value from before the block;
//   - a function called inside an `if` sees the field at its own previous call;
//   - a var instance declared inside the block keeps the block's own history.
// Each control below is computed by an independent path (a plain series or a function's history).

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

async function plotsOf(body: string): Promise<Record<string, any[]>> {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-03').getTime());
    const { plots } = await pineTS.run(`//@version=5
indicator("udt field history")
type B
    float c
k = bar_index % 4
${body}`);
    const out: Record<string, any[]> = {};
    for (const [name, p] of Object.entries<any>(plots)) {
        out[name] = p.data.map((d: any) => (d.value === null || d.value === undefined || Number.isNaN(d.value) ? 'na' : Number(d.value).toFixed(6)));
    }
    return out;
}

function expectSame(p: Record<string, any[]>, got: string, want: string) {
    expect(p[got].length).toBeGreaterThan(40);
    expect(p[got]).toEqual(p[want]);
    expect(p[got].filter((v) => v !== 'na').length).toBeGreaterThan(5);
}

describe('UDT field history on a var instance', () => {
    it('global read, variable index and reassigned index', async () => {
        const p = await plotsOf(`var b = B.new(0.0)
b.c := close
plot(b.c[1], "b1")
plot(close[1], "c1")
n = input.int(3, minval = 1)
n := n > 2 ? 2 : n
plot(b.c[n], "bn")
plot(close[2], "c2")`);
        expectSame(p, 'b1', 'c1');
        expectSame(p, 'bn', 'c2');
    });

    it('a read inside an if is the previous bar, not the previous execution of the block', async () => {
        const p = await plotsOf(`var b = B.new(0.0)
b.c := close
float r = na
float ctrl = na
if k == 0
    r := b.c[1]
    ctrl := close[1]
plot(r, "r")
plot(ctrl, "ctrl")
float r2 = 0.0
float ctrl2 = 0.0
if k >= 1
    if k >= 2
        for i = 1 to 2
            r2 += b.c[i]
            ctrl2 += close[i]
plot(r2, "r2")
plot(ctrl2, "ctrl2")
n = k
r3 = switch k
    1 => b.c[1]
    2 => b.c[n]
    => -1.0
plot(r3, "r3")
plot(k == 1 ? close[1] : k == 2 ? close[2] : -1.0, "ctrl3")`);
        expectSame(p, 'r', 'ctrl');
        expectSame(p, 'r2', 'ctrl2');
        expectSame(p, 'r3', 'ctrl3');
    });

    it('the history is the field as the statement saw it, before or after a set', async () => {
        const p = await plotsOf(`var b = B.new(0.0)
plot(b.c[1], "before set")
b.c := close
plot(bar_index < 2 ? na : close[2], "close2")
var b4 = B.new(0.0)
float seen = b4.c
float r = na
if k != 3
    b4.c := close
    r := b4.c[1]
plot(r, "set then read")
plot(k != 3 ? seen[1] : na, "seen1")`);
        expect(p['before set'].slice(2)).toEqual(p['close2'].slice(2));
        expectSame(p, 'set then read', 'seen1');
    });

    it('a parameter read inside an if, and a function called inside an if', async () => {
        const p = await plotsOf(`var b = B.new(0.0)
b.c := close
f(B o) =>
    float v = na
    if k == 3
        v := o.c[1]
    v
plot(f(b), "param in if")
plot(k == 3 ? close[1] : na, "ctrl")
g(B o) => o.c[1]
h(float x) => x[1]
float r = na
float ctrl2 = na
if k == 1
    r := g(b)
    ctrl2 := h(b.c)
plot(r, "fn in if")
plot(ctrl2, "ctrl2")`);
        expectSame(p, 'param in if', 'ctrl');
        expectSame(p, 'fn in if', 'ctrl2');
    });

    it('a var instance declared inside the block keeps its own history', async () => {
        const p = await plotsOf(`float r = na
float ctrl = na
if k != 1
    var B inner = B.new(0.0)
    var float lastOpen = na
    inner.c := open
    r := inner.c[1]
    ctrl := lastOpen
    lastOpen := open
plot(r, "r")
plot(ctrl, "ctrl")`);
        expect(p['r'].slice(2)).toEqual(p['ctrl'].slice(2));
    });
});

describe('UDT field history on a per-bar instance', () => {
    it('reads the instance from N bars ago, also inside an if', async () => {
        const p = await plotsOf(`b = B.new(close)
plot(b.c[2], "b2")
plot(close[2], "c2")
float r = na
float ctrl = na
if k == 0
    r := b.c[1]
    ctrl := close[1]
plot(r, "r")
plot(ctrl, "ctrl")`);
        // The per-bar read is missing from the plot on bar 0 (out of range there): compare the tails.
        expect(p['b2'].slice(-40)).toEqual(p['c2'].slice(-40));
        expect(p['r'].slice(-40)).toEqual(p['ctrl'].slice(-40));
        expect(p['r'].slice(-40).filter((v) => v !== 'na').length).toBeGreaterThan(5);
    });
});
