// SPDX-License-Identifier: AGPL-3.0-only
// Comma-separated declarations in a function body, dotted parameter types with `[]`, and the v6 `once`
// structure. Each expected value is what TradingView shows on every bar of the same script (BINANCE:BTCUSDT 1h).

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

async function run(body: string, version = 6) {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, Date.UTC(2025, 0, 1), Date.UTC(2025, 0, 2));
    const { plots } = await pineTS.run(`//@version=${version}\nindicator("t")\n${body}`);
    const col = (title: string) => plots[title].data.map((d: any) => d.value);
    return col;
}

describe('comma-separated declarations inside a function body (16)', () => {
    it('accepts var, typed and tuple declarations followed by other statements on the same line', async () => {
        const col = await run(`
g() => [close, open]
f() =>
    var a = 0., var b = 0., c = close
    a + b + c
k() =>
    [x, y] = g(), d = x - y, var e = 1.0, e += 1, d + e
m() =>
    var float s = 0., s += close, float t = s / 2, t
n() =>
    float t = 1.0, t * 2
q() =>
    int i = 3, float j = i / 2, j + 0.25
plot(f(), "f")
plot(k(), "k")
plot(m(), "m")
plot(n(), "n")
plot(q(), "q")
plot(close, "close")
plot(open, "open")
plot(bar_index, "bi")
`);
        const close = col('close');
        const open = col('open');
        let sum = 0;
        col('bi').forEach((bi: number, i: number) => {
            sum += close[i];
            expect(col('f')[i]).toBeCloseTo(close[i], 8);
            expect(col('k')[i]).toBeCloseTo(close[i] - open[i] + bi + 2, 8);
            expect(col('m')[i]).toBeCloseTo(sum / 2, 6);
            expect(col('n')[i]).toBe(2);
            expect(col('q')[i]).toBe(1.75);
        });
    });
});

describe('dotted parameter types (17)', () => {
    it('parses chart.point[] / chart.point / array<chart.point> parameters', async () => {
        const col = await run(`
f(chart.point[] pts) =>
    pts.size()
g(chart.point p) =>
    p.price
h(array<chart.point> pts, simple int n) =>
    pts.size() * n
var chart.point[] ps = array.new<chart.point>()
if ps.size() < 3
    ps.push(chart.point.from_index(bar_index, close))
plot(f(ps), "f")
plot(g(chart.point.from_index(bar_index, close)) - close, "g")
plot(h(ps, 2), "h")
`);
        expect(col('f')).toEqual(col('f').map((_: number, i: number) => Math.min(i + 1, 3)));
        expect(col('g').every((v: number) => v === 0)).toBe(true);
        expect(col('h')).toEqual(col('f').map((v: number) => v * 2));
    });
});

describe('once (v6)', () => {
    it('runs its block the first time the condition is true, per call site, and never again', async () => {
        const col = await run(`
var float atThree = na
once bar_index >= 3
    atThree := bar_index
var int runs = 0
once bar_index % 4 == 1
    runs += 1
var int d = 0
once
    d += 1
f(float src) =>
    var float v = na
    once src > 5
        v := src
    v
var float inIf = na
if bar_index % 2 == 0
    once bar_index >= 3
        inIf := bar_index
var float nested = na
once bar_index >= 2
    once bar_index == 5
        nested := 1
float naCond = na
var int naRuns = 0
once naCond > 0
    naRuns += 1
plot(atThree, "atThree")
plot(runs, "runs")
plot(d, "d")
plot(f(bar_index), "a")
plot(f(bar_index * 2), "b")
plot(inIf, "inIf")
plot(nested, "nested")
plot(naRuns, "naRuns")
plot(bar_index, "bi")
`);
        col('bi').forEach((bi: number, i: number) => {
            if (bi < 3) expect(col('atThree')[i]).toBeNaN();
            else expect(col('atThree')[i]).toBe(3);
            expect(col('runs')[i]).toBe(bi >= 1 ? 1 : 0);
            expect(col('d')[i]).toBe(1);
            // Separate call sites: bar_index > 5 first at bar 6, 2 * bar_index > 5 first at bar 3.
            if (bi < 6) expect(col('a')[i]).toBeNaN();
            else expect(col('a')[i]).toBe(6);
            if (bi < 3) expect(col('b')[i]).toBeNaN();
            else expect(col('b')[i]).toBe(6);
            // Inside an if: the block first runs on an even bar >= 3.
            if (bi < 4) expect(col('inIf')[i]).toBeNaN();
            else expect(col('inIf')[i]).toBe(4);
            // The outer block ran at bar 2, when the inner condition was false: never again.
            expect(col('nested')[i]).toBeNaN();
            expect(col('naRuns')[i]).toBe(0);
        });
    });

    it('does not evaluate the condition after the block has run', async () => {
        const col = await run(`
var calls = array.new<int>()
cond(int[] a) =>
    a.push(1)
    bar_index >= 3
var int runs = 0
once cond(calls)
    runs += 1
plot(calls.size(), "calls")
plot(runs, "runs")
plot(bar_index, "bi")
`);
        col('bi').forEach((bi: number, i: number) => {
            expect(col('calls')[i]).toBe(Math.min(bi + 1, 4));
            expect(col('runs')[i]).toBe(bi >= 3 ? 1 : 0);
        });
    });

    it('keeps `once` usable as a variable name in Pine v5', async () => {
        const col = await run(`
once = close
once := once + 1
plot(once - close, "d")
`, 5);
        expect(col('d').every((v: number) => Math.abs(v - 1) < 1e-9)).toBe(true);
    });
});
