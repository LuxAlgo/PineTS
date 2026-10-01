// SPDX-License-Identifier: AGPL-3.0-only
// color.rgb / color.new / color.from_gradient / color.r,g,b,t / fixnan on colors / chart.fg_color.
// Every expected value was read on TradingView (BINANCE:BTCUSDT 1h) from the same expressions.

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

async function lastValues(body: string) {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, Date.UTC(2025, 0, 1), Date.UTC(2025, 0, 2));
    const { plots } = await pineTS.run(`//@version=6\nindicator("t")\n${body}`);
    const out: Record<string, number> = {};
    for (const [title, p] of Object.entries<any>(plots)) out[title] = p.data[p.data.length - 1].value;
    return out;
}

describe('color.rgb truncates and clamps its components (D1)', () => {
    it('matches TradingView for fractional, out-of-range and na components', async () => {
        const v = await lastValues(`
float nv = na
c1 = color.rgb(10.9, 2.5, 3.99)
c2 = color.rgb(10.9, 2.5, 3.99, 50.7)
c3 = color.rgb(300, -5, 128.5, 120)
c4 = color.rgb(1, 2, 3, -10)
c5 = color.rgb(nv, 2, 3, nv)
plot(color.r(c1), "r1")
plot(color.g(c1), "g1")
plot(color.b(c1), "b1")
plot(color.t(c1), "t1")
plot(color.t(c2), "t2")
plot(color.r(c3), "r3")
plot(color.g(c3), "g3")
plot(color.b(c3), "b3")
plot(color.t(c3), "t3")
plot(color.t(c4), "t4")
plot(color.r(c5), "r5")
plot(color.t(c5), "t5")
plot(na(c5) ? 1 : 0, "na5")
plot(color.t(color.rgb(0, 0, 0, 1.49)), "t 1.49")
plot(color.t(color.rgb(0, 0, 0, 16.49)), "t 16.49")
`);
        expect(v).toMatchObject({ r1: 10, g1: 2, b1: 3, t1: 0, t2: 51, r3: 255, g3: 0, b3: 128, t3: 100, t4: 0, r5: 0, t5: 100, na5: 0 });
        // The transparency is stored as an alpha byte: 1.49 -> 2, 16.49 -> 16.
        expect(v['t 1.49']).toBe(2);
        expect(v['t 16.49']).toBe(16);
    });
});

describe('color.new clamps and truncates the transparency (D9)', () => {
    it('matches TradingView for out-of-range, fractional and na transparency and an na color', async () => {
        const v = await lastValues(`
color nc = na
float nt = na
float hi = bar_index >= 0 ? 150 : 0
float lo = bar_index >= 0 ? -20 : 0
plot(color.t(color.new(color.red, hi)), "t hi")
plot(color.t(color.new(color.red, lo)), "t lo")
plot(color.t(color.new(color.red, 33.7)), "t 33.7")
plot(color.t(color.new(color.new(color.red, 50), 20)), "t replaced")
plot(color.t(color.new(color.red, nt)), "t na")
plot(color.r(color.new(color.red, nt)), "r na")
plot(na(color.new(nc, 50)) ? 1 : 0, "na color is na")
plot(color.r(color.new(nc, 50)), "na color r")
plot(color.t(color.new(nc, 50)), "na color t")
`);
        expect(v).toMatchObject({ 't hi': 100, 't lo': 0, 't 33.7': 33, 't replaced': 20, 't na': 100, 'r na': 242 });
        expect(v).toMatchObject({ 'na color is na': 0, 'na color r': 0, 'na color t': 50 });
    });

    it('color.r/g/b/t of na are 0/0/0/100', async () => {
        const v = await lastValues(`
color nc = na
plot(color.r(nc), "r")
plot(color.g(nc), "g")
plot(color.b(nc), "b")
plot(color.t(nc), "t")
`);
        expect(v).toMatchObject({ r: 0, g: 0, b: 0, t: 100 });
    });
});

describe('color.from_gradient interpolates with premultiplied alpha (D2)', () => {
    const grad = (v: number) => `
g1 = color.from_gradient(${v}, 0, 12, color.new(color.red, 80), color.new(color.blue, 10))
plot(color.r(g1), "r")
plot(color.g(g1), "g")
plot(color.b(g1), "b")
plot(color.t(g1), "t")
`;

    it('matches TradingView between two semi-transparent colors', async () => {
        expect(await lastValues(grad(1))).toMatchObject({ r: 183, g: 66, b: 123, t: 75 });
        expect(await lastValues(grad(4))).toMatchObject({ r: 102, g: 84, b: 197, t: 57 });
        expect(await lastValues(grad(10))).toMatchObject({ r: 49, g: 96, b: 247, t: 22 });
    });

    it('truncates channels exactly as TradingView at integer boundaries', async () => {
        const v = await lastValues(`
color nc = na
plot(color.r(color.from_gradient(4, 0, 12, #000000, #FFFFFF)), "bw 4")
plot(color.r(color.from_gradient(6, 0, 12, #000000, #FFFFFF)), "bw 6")
plot(color.r(color.from_gradient(10, 0, 12, color.red, nc)), "red to na r")
plot(color.t(color.from_gradient(10, 0, 12, color.red, nc)), "red to na t")
`);
        expect(v).toMatchObject({ 'bw 4': 84, 'bw 6': 127, 'red to na r': 241, 'red to na t': 84 });
    });

    it('is transparent black, not na, for an na value, an na bound or a flat range', async () => {
        const v = await lastValues(`
float nv = na
g2 = color.from_gradient(5, 3, 3, color.red, color.blue)
g3 = color.from_gradient(nv, 0, 1, color.red, color.blue)
g9 = color.from_gradient(0.5, nv, 1, color.red, color.blue)
plot(na(g2) ? 1 : 0, "flat na")
plot(color.r(g2), "flat r")
plot(color.t(g2), "flat t")
plot(na(g3) ? 1 : 0, "value na")
plot(color.t(g3), "value t")
plot(na(g9) ? 1 : 0, "bound na")
plot(color.t(g9), "bound t")
`);
        expect(v).toMatchObject({ 'flat na': 0, 'flat r': 0, 'flat t': 100, 'value na': 0, 'value t': 100, 'bound na': 0, 'bound t': 100 });
    });

    it('gives the bottom color for reversed bounds, and fades an na endpoint color', async () => {
        const v = await lastValues(`
color cna = na
gb = color.from_gradient(5.0, 0.0, 10.0, cna, color.red)
gr0 = color.from_gradient(0.0, 100.0, 0.0, color.red, color.lime)
gr25 = color.from_gradient(25.0, 100.0, 0.0, color.red, color.lime)
gr150 = color.from_gradient(150.0, 100.0, 0.0, color.red, color.lime)
plot(color.r(gb), "gb r")
plot(color.g(gb), "gb g")
plot(color.t(gb), "gb t")
plot(color.r(gr0), "gr0 r")
plot(color.g(gr0), "gr0 g")
plot(color.r(gr25), "gr25 r")
plot(color.t(gr25), "gr25 t")
plot(color.r(gr150), "gr150 r")
`);
        expect(v).toMatchObject({ 'gb r': 242, 'gb g': 54, 'gb t': 50, 'gr0 r': 242, 'gr0 g': 54, 'gr25 r': 242, 'gr25 t': 0, 'gr150 r': 242 });
    });
});

describe('fixnan on colors (K10)', () => {
    it('keeps the last non-na color', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, Date.UTC(2025, 0, 1), Date.UTC(2025, 0, 2));
        const { plots } = await pineTS.run(`//@version=6
indicator("t")
color c = bar_index % 3 == 0 ? color.new(color.rgb(bar_index % 256, 10, 20), 30) : na
f = fixnan(c)
plot(color.r(f), "fr")
plot(color.t(f), "ft")
plot(na(f) ? 1 : 0, "fna")
plot(bar_index, "bi")
`);
        const bi = plots['bi'].data.map((d: any) => d.value);
        const fr = plots['fr'].data.map((d: any) => d.value);
        const ft = plots['ft'].data.map((d: any) => d.value);
        const fna = plots['fna'].data.map((d: any) => d.value);
        expect(bi.length).toBeGreaterThan(6);
        bi.forEach((b: number, i: number) => {
            expect(fr[i]).toBe((b - (b % 3)) % 256);
            expect(ft[i]).toBe(30);
            expect(fna[i]).toBe(0);
        });
    });
});

describe('chart.fg_color / chart.bg_color are colors, not functions (22b)', () => {
    it('can be stored in a variable, passed through a function and pushed into a color array', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, Date.UTC(2025, 0, 1), Date.UTC(2025, 0, 2));
        const { plots } = await pineTS.run(`//@version=6
indicator("t")
COL_VAL = chart.fg_color
BG = chart.bg_color
var tc = array.new<color>()
addRow(color c) =>
    array.push(tc, c)
    array.size(tc)
if barstate.islast
    addRow(true ? COL_VAL : color.green)
    tc.push(COL_VAL)
    array.push(tc, chart.fg_color)
    array.push(tc, BG)
plot(array.size(tc), "size")
plot(color.r(array.size(tc) > 0 ? array.get(tc, 0) : na) == color.r(chart.fg_color) ? 1 : 0, "same")
`);
        const size = plots['size'].data;
        expect(size[size.length - 1].value).toBe(4);
        expect(plots['same'].data[size.length - 1].value).toBe(1);
    });
});
