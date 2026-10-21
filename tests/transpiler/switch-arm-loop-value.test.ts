// SPDX-License-Identifier: AGPL-3.0-only
// A block used as a value takes the value of its last statement, a loop included: whatever the loop
// body's last statement produced on the final iteration, or na when that iteration skipped it.
// Values measured on TradingView (Pine v6, BINANCE:BTCUSDT 1h); they do not depend on the data.

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

async function plotsOf(body: string): Promise<Record<string, any[]>> {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-02').getTime());
    const { plots } = await pineTS.run(`//@version=6
indicator("loop value")
k = bar_index % 4
${body}`);
    const out: Record<string, any[]> = {};
    for (const [name, p] of Object.entries<any>(plots)) {
        out[name] = p.data.map((d: any) => (d.value === null || d.value === undefined || Number.isNaN(d.value) ? 'na' : d.value));
    }
    return out;
}

// value by k = bar_index % 4, for the first 8 bars
const byK = (values: any[]) => [0, 1, 2, 3, 0, 1, 2, 3].map((k) => values[k]);

describe('a loop as the value of a switch arm', () => {
    it('a function whose switch arm ends in a for loop returns the loop value', async () => {
        const p = await plotsOf(`f(int m) =>
    switch m
        0 =>
            float s = 0.0
            for i = 1 to 3
                s += i
        => -1.0
plot(f(k), "f")`);
        expect(p['f'].slice(0, 8)).toEqual(byK([6, -1, -1, -1]));
    });

    it('a bare switch as the last statement, with the loop counter in the header (#318 shape)', async () => {
        const p = await plotsOf(`g(bool cond) =>
    float s = 0.0
    switch
        cond =>
            for iR = 1 to 3
                s += iR
        => s
plot(g(k == 1), "g")`);
        expect(p['g'].slice(0, 8)).toEqual(byK([0, 6, 0, 0]));
    });

    it('for-in and while arms', async () => {
        const p = await plotsOf(`w = switch
    k == 3 =>
        float u = 0.0
        for z in array.from(1.0, 2.0, 4.0)
            u += z
    => -2.0
plot(w, "for-in")
h(int m) =>
    r = switch m
        0 =>
            int c = 0
            while c < 3
                c += 1
        => -3
    r
plot(h(k), "while")`);
        expect(p['for-in'].slice(0, 8)).toEqual(byK([-2, -2, -2, 7]));
        expect(p['while'].slice(0, 8)).toEqual(byK([3, -3, -3, -3]));
    });

    it('a loop whose final iteration skips its last statement gives na; a counting-down loop still runs', async () => {
        const p = await plotsOf(`h(int m) =>
    switch
        m == 2 =>
            float t = 0.0
            for i = 1 to 3
                if i == 2
                    t += 10
        => 5.0
plot(h(k), "skipped")
q(int m) =>
    switch m
        3 =>
            float t = 0.0
            for i = 0 to -1
                t += 1
        => 9.0
plot(q(k), "down")`);
        expect(p['skipped'].slice(0, 8)).toEqual(byK([5, 5, 'na', 5]));
        expect(p['down'].slice(0, 8)).toEqual(byK([9, 9, 9, 2]));
    });

    it('an arm ending in a compound assignment returns the variable', async () => {
        const p = await plotsOf(`f2(int m) =>
    switch m
        0 =>
            float s = 0.0
            s += 2
        => -1.0
plot(f2(k), "f2")`);
        expect(p['f2'].slice(0, 8)).toEqual(byK([2, -1, -1, -1]));
    });
});

describe('a loop as the value of other blocks', () => {
    it('an if branch, an if expression assigned with :=, and nested loops', async () => {
        const p = await plotsOf(`f(int m) =>
    float s = 0.0
    if m == 1
        for i = 1 to 4
            s += i
    else
        s - 1
plot(f(k), "if branch")
g(int m) =>
    float r = na
    r := if m == 1
        int c = 0
        while c < 5
            c += 1
    else
        -2
    r
plot(g(k), "if expr")
n(int m) =>
    float acc = 0.0
    for i = 0 to 1
        for j = 0 to m
            acc += 1
plot(n(k), "nested")`);
        expect(p['if branch'].slice(0, 8)).toEqual(byK([-1, 10, -1, -1]));
        expect(p['if expr'].slice(0, 8)).toEqual(byK([-2, 5, -2, -2]));
        expect(p['nested'].slice(0, 8)).toEqual(byK([2, 4, 6, 8]));
    });
});
