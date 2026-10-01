// SPDX-License-Identifier: AGPL-3.0-only
// Control flow and scope in generated code. Each expected value is the behavior TradingView shows
// on every bar of the same scripts (BINANCE:BTCUSDT 1h).

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

async function run(source: string) {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, Date.UTC(2025, 0, 1), Date.UTC(2025, 0, 3));
    return pineTS.run(source);
}
const values = (plots: any, title: string) => (plots[title]?.data ?? []).map((d: any) => d.value);
const header = `//@version=6\nindicator("t")\nk = bar_index % 4\nplot(bar_index, "bar_index")\nplot(close, "close")\nplot(open, "open")\n`;

describe('else if conditions run only when the earlier branches were not taken (9)', () => {
    it('does not evaluate array.get in an else-if condition after a taken branch', async () => {
        const { plots } = await run(
            header +
                `a = array.from(1.0, 2.0)
v = 0.0
if k >= 2
    v := 1
else if array.get(a, k) > 1
    v := 2
else
    v := 3
plot(v, "fn form")
w = 0.0
if k >= 2
    w := 1
else if a.get(k) > 1
    w := 2
plot(w, "method form")
f(int i) =>
    r = 0.0
    if i >= 2
        r := 1
    else if array.get(a, i) > 1
        r := 2
    else if array.get(a, i + 1) > 1
        r := 3
    r
plot(f(k), "in function")`
        );
        const ks = values(plots, 'bar_index').map((b: number) => b % 4);
        expect(ks.length).toBeGreaterThan(40);
        expect(values(plots, 'fn form')).toEqual(ks.map((k: number) => (k >= 2 ? 1 : k === 1 ? 2 : 3)));
        expect(values(plots, 'method form')).toEqual(ks.map((k: number) => (k >= 2 ? 1 : k === 1 ? 2 : 0)));
        expect(values(plots, 'in function')).toEqual(ks.map((k: number) => (k >= 2 ? 1 : k === 1 ? 2 : 3)));
    });
});

describe('na() in a while condition (4c)', () => {
    it('evaluates `while i >= 0 and na(level)` on every iteration', async () => {
        const { plots } = await run(
            header +
                `f(int start) =>
    float level = na
    int i = start
    while i >= 0 and na(level)
        if i <= 1
            level := close[i]
        i -= 1
    [level, i]
[lv, li] = f(k)
plot(lv, "level")
plot(li, "i")
g() =>
    float x = na
    n = 0
    while na(x) and n < 5
        x := n == k ? close : na
        n += 1
    n
plot(g(), "n")`
        );
        const ks = values(plots, 'bar_index').map((b: number) => b % 4);
        const close = values(plots, 'close');
        const level = values(plots, 'level');
        ks.forEach((k: number, j: number) => {
            if (j === 0) return;
            expect(level[j]).toBe(k === 0 ? close[j] : close[j - 1]);
        });
        expect(values(plots, 'i')).toEqual(ks.map((k: number) => (k === 0 ? -1 : 0)));
        expect(values(plots, 'n')).toEqual(ks.map((k: number) => k + 1));
    });
});

describe('a parameter named like a user function it calls (6b)', () => {
    it('calls the function, not the parameter', async () => {
        const { plots } = await run(
            header +
                `double(x) => x * 2
g(double) => double(double)
plot(g(close), "g")
label(string label) => label == "A" ? 1 : 0
labelOf(string label) => label(label)
plot(labelOf(k == 0 ? "A" : "B"), "label")
timeframe(timeframe) =>
    timeframe == "x" ? timeframe.in_seconds() : 0
timeframeText(timeframe) =>
    timeframe(timeframe)
plot(timeframeText(k == 1 ? "x" : "y"), "timeframe")`
        );
        const ks = values(plots, 'bar_index').map((b: number) => b % 4);
        expect(values(plots, 'g')).toEqual(values(plots, 'close').map((c: number) => c * 2));
        expect(values(plots, 'label')).toEqual(ks.map((k: number) => (k === 0 ? 1 : 0)));
        expect(values(plots, 'timeframe')).toEqual(ks.map((k: number) => (k === 1 ? 3600 : 0)));
    });
});

describe('tuple and comma-separated declarations in a switch arm used as a value (24)', () => {
    it('keeps the declared names in scope for the rest of the arm', async () => {
        const { plots } = await run(
            header +
                `coords(float a) =>
    [a * 2, a * 3]
f(string mode, float a) =>
    [p, s] = switch mode
        "A" =>
            [x, y] = coords(a)
            [x + y, 1]
        =>
            [x, y] = coords(a)
            [math.max(x, y), 2]
    p + s
plot(f(k == 0 ? "A" : "B", close), "tuple")
g() =>
    switch
        close > open =>
            a = close, c = a - open
            c * 2
        => 1.0
plot(g(), "comma")
v = switch k
    0 =>
        [x, y] = coords(close)
        x - y
    =>
        b = open, d = b + 1
        d
plot(v, "global")`
        );
        const ks = values(plots, 'bar_index').map((b: number) => b % 4);
        const close = values(plots, 'close');
        const open = values(plots, 'open');
        const near = (got: number[], want: number[]) => got.forEach((g, j) => expect(g).toBeCloseTo(want[j], 6));
        near(values(plots, 'tuple'), ks.map((k: number, j: number) => (k === 0 ? 5 * close[j] + 1 : 3 * close[j] + 2)));
        near(values(plots, 'comma'), close.map((c: number, j: number) => (c > open[j] ? (c - open[j]) * 2 : 1)));
        near(values(plots, 'global'), ks.map((k: number, j: number) => (k === 0 ? -close[j] : open[j] + 1)));
    });
});

describe('switch without a default arm (R5)', () => {
    it('is na when no arm matches, and registers no extra plot', async () => {
        const { plots } = await run(
            `//@version=6
indicator("t")
k = bar_index % 4
plot(bar_index, "bar_index")
x = switch k
    0 => 1.0
    1 => 2.0
plot(x, "x")
f() =>
    switch k
        2 => 5.0
        3 => 6.0
plot(f(), "f")`
        );
        const ks = values(plots, 'bar_index').map((b: number) => b % 4);
        const isNa = (v: any) => typeof v === 'number' && Number.isNaN(v);
        values(plots, 'x').forEach((v: any, j: number) => (ks[j] < 2 ? expect(v).toBe(ks[j] + 1) : expect(isNa(v)).toBe(true)));
        values(plots, 'f').forEach((v: any, j: number) => (ks[j] >= 2 ? expect(v).toBe(ks[j] + 3) : expect(isNa(v)).toBe(true)));
        expect(Object.keys(plots).filter((p) => !p.startsWith('__')).sort()).toEqual(['bar_index', 'f', 'x']);
    });
});

describe('bool history before bar 0 (R3)', () => {
    const script = (version: number) => `//@version=${version}
indicator("t")
bs = close > open
plot(bs[1] == false ? 1 : 0, "eq false")
plot(bs[1] ? 1 : 0, "truthy")
plot(${version >= 6 ? '0' : 'na(bs[1]) ? 1 : 0'}, "na")
f(bool b) => b[2] == false ? 1 : 0
plot(f(close > open), "param")`;

    it('is false in Pine v6', async () => {
        const { plots } = await run(script(6));
        expect(values(plots, 'eq false')[0]).toBe(1);
        expect(values(plots, 'truthy')[0]).toBe(0);
        expect(values(plots, 'param').slice(0, 2)).toEqual([1, 1]);
    });

    it('stays na in Pine v5', async () => {
        const { plots } = await run(script(5));
        expect(values(plots, 'na')[0]).toBe(1);
        expect(values(plots, 'eq false')[0]).toBe(0);
    });
});
