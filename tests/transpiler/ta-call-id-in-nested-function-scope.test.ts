// SPDX-License-Identifier: AGPL-3.0-only
// A stateful call (ta.*, seeded math.random) inside an `if` / `for` / `else if` of a user function keeps
// its own state per call of the function. Each expected relation holds on every bar on TradingView for
// the same scripts (BINANCE:BTCUSDT 1h, 400 bars).

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

async function run(source: string) {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, Date.UTC(2024, 0, 1), Date.UTC(2024, 0, 5));
    return pineTS.run(source);
}
const values = (plots: any, title: string) => (plots[title]?.data ?? []).map((d: any) => d.value);
const expectPairs = (plots: any, names: string[]) => {
    for (const name of names) {
        const got = values(plots, name);
        expect(got.length, name).toBeGreaterThan(50);
        expect(got, name).toEqual(values(plots, name + '_ref'));
    }
};

describe('stateful calls nested in a block of a user function', () => {
    it('keeps a ta call hoisted out of an if condition separate per call', async () => {
        const { plots } = await run(`//@version=6
indicator("t")
f(float src, int len) =>
    r = 0.0
    if ta.sma(src, len) > src
        r := 1.0
    r
plot(f(close, 5), "a")
plot(f(open, 20), "b")
plot(ta.sma(close, 5) > close ? 1.0 : 0.0, "a_ref")
plot(ta.sma(open, 20) > open ? 1.0 : 0.0, "b_ref")`);
        expectPairs(plots, ['a', 'b']);
    });

    it('keeps ta calls in an if body, a for loop, an else-if condition and a nested if separate per call', async () => {
        const { plots } = await run(`//@version=6
indicator("t")
g(float src, int len) =>
    r = 0.0
    if bar_index > 2
        r := ta.sma(src, len)
    r
h(float src, int len) =>
    s = 0.0
    for i = 0 to 1
        s += ta.ema(src, len)
    s
k(float src, int len) =>
    r = 0.0
    if bar_index < 0
        r := -1.0
    else if ta.rsi(src, len) > 50
        r := 1.0
    r
n(float src, int len) =>
    r = 0.0
    if bar_index >= 0
        if ta.sma(src, len) > src
            r := 1.0
    r
plot(g(close, 5), "g")
plot(g(open, 20), "g2")
plot(bar_index > 2 ? ta.sma(close, 5) : 0.0, "g_ref")
plot(bar_index > 2 ? ta.sma(open, 20) : 0.0, "g2_ref")
plot(h(close, 5), "h")
plot(h(open, 20), "h2")
plot(2 * ta.ema(close, 5), "h_ref")
plot(2 * ta.ema(open, 20), "h2_ref")
plot(k(close, 5), "k")
plot(k(open, 20), "k2")
r5 = ta.rsi(close, 5)
r20 = ta.rsi(open, 20)
plot(r5 > 50 ? 1.0 : 0.0, "k_ref")
plot(r20 > 50 ? 1.0 : 0.0, "k2_ref")
plot(n(close, 5), "n")
plot(n(open, 20), "n2")
plot(ta.sma(close, 5) > close ? 1.0 : 0.0, "n_ref")
plot(ta.sma(open, 20) > open ? 1.0 : 0.0, "n2_ref")`);
        expectPairs(plots, ['g', 'g2', 'h', 'h2', 'k', 'k2', 'n', 'n2']);
    });

    it('keeps the positions that already worked (while condition, switch, ternary) separate per call', async () => {
        const { plots } = await run(`//@version=6
indicator("t")
w(float src, int len) =>
    c = 0
    while ta.sma(src, len) > src and c < 1
        c += 1
    c
sw(float src, int len) =>
    switch
        ta.wma(src, len) > src => 1.0
        => 0.0
t(float src, int len) =>
    ta.hma(src, len) > src ? 1.0 : 0.0
plot(w(close, 5), "w")
plot(w(open, 20), "w2")
plot(ta.sma(close, 5) > close ? 1 : 0, "w_ref")
plot(ta.sma(open, 20) > open ? 1 : 0, "w2_ref")
plot(sw(close, 5), "sw")
plot(sw(open, 20), "sw2")
plot(ta.wma(close, 5) > close ? 1.0 : 0.0, "sw_ref")
plot(ta.wma(open, 20) > open ? 1.0 : 0.0, "sw2_ref")
plot(t(close, 5), "t")
plot(t(open, 20), "t2")
plot(ta.hma(close, 5) > close ? 1.0 : 0.0, "t_ref")
plot(ta.hma(open, 20) > open ? 1.0 : 0.0, "t2_ref")`);
        expectPairs(plots, ['w', 'w2', 'sw', 'sw2', 't', 't2']);
    });

    it('gives a seeded math.random in an if body its own generator per call', async () => {
        const { plots } = await run(`//@version=6
indicator("t")
f(int seed) =>
    r = 0.0
    if bar_index >= 0
        r := math.random(0, 1, seed)
    r
g(int seed) =>
    math.random(0, 1, seed)
plot(f(42), "a")
plot(f(42), "b")
plot(g(42), "a_ref")
plot(g(42), "b_ref")`);
        expectPairs(plots, ['a', 'b']);
        // java.util.Random(42).nextDouble()
        expect(values(plots, 'a')[0]).toBeCloseTo(0.7275636800328681, 9);
    });
});
