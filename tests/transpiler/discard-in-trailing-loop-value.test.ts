// SPDX-License-Identifier: AGPL-3.0-only
// A `_` declaration that ends a block gives the block no value (na): Pine cannot read `_` back.
// The block's value used to be read from `_`, which codegen renames to `_$N`, so the script
// failed with "Undeclared identifier _". Since the trailing-loop value capture (#318) this also
// hit a discard in a loop that ends an `if` branch or a switch arm, which ran on 0.12.0.

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';

const MINUTE = 60_000;
const T0 = Date.UTC(2024, 0, 1);
const bars = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
        openTime: T0 + i * MINUTE,
        closeTime: T0 + (i + 1) * MINUTE,
        open: 1,
        high: 1,
        low: 1,
        close: 1,
        volume: 1,
    }));

async function plotsOf(count: number, body: string): Promise<Record<string, any[]>> {
    const { plots } = await new PineTS(bars(count), 'TEST', '1').run(`//@version=6
indicator("t")
${body}`);
    const out: Record<string, any[]> = {};
    for (const [name, p] of Object.entries<any>(plots)) {
        out[name] = p.data.map((d: any) => (d.value === null || d.value === undefined || Number.isNaN(d.value) ? 'na' : d.value));
    }
    return out;
}

describe('a `_` declaration as the last statement of a block', () => {
    it('in a loop that ends an if branch at the end of a function', async () => {
        const p = await plotsOf(
            2,
            `f(array<float> a) =>
    if a.size() > 0
        for i = a.size() - 1 to 0
            if a.get(i) > 1
                _ = a.remove(i)
var arr = array.from(1.0, 2.0, 3.0)
v = f(arr)
plot(arr.size(), "n")
plot(v, "v")`,
        );
        expect(p['n']).toEqual([1, 1]);
        expect(p['v']).toEqual(['na', 'na']);
    });

    it('a loop whose final iteration runs the discard is na; a named declaration keeps its value', async () => {
        const p = await plotsOf(
            2,
            `drain(array<float> a) =>
    for i = 0 to 2
        _ = a.pop()
lastTimesTen(array<float> a) =>
    for i = 0 to a.size() - 1
        x = a.get(i) * 10
var arr = array.from(1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0)
v = drain(arr)
plot(v, "v")
plot(arr.size(), "n")
plot(lastTimesTen(arr), "x")`,
        );
        expect(p['v']).toEqual(['na', 'na']);
        expect(p['n']).toEqual([4, 1]);
        expect(p['x']).toEqual([40, 10]);
    });

    it('in a loop that ends a switch arm: that arm is na, the other keeps its value', async () => {
        const p = await plotsOf(
            3,
            `var arr = array.from(1.0, 2.0, 3.0)
v = switch
    arr.size() > 1 =>
        for i = arr.size() - 1 to 1
            _ = arr.remove(i)
    => -1.0
plot(v, "v")
plot(arr.size(), "n")`,
        );
        expect(p['v']).toEqual(['na', -1, -1]);
        expect(p['n']).toEqual([1, 1, 1]);
    });

    it('at the end of a function and of an if branch', async () => {
        const p = await plotsOf(
            2,
            `take(array<float> a) =>
    _ = a.shift()
takeIf(array<float> a, bool cond) =>
    if cond
        _ = a.shift()
    else
        -1.0
var arr = array.from(1.0, 2.0, 3.0, 4.0, 5.0)
v = take(arr)
w = takeIf(arr, bar_index == 0)
plot(v, "v")
plot(w, "w")
plot(arr.size(), "n")`,
        );
        expect(p['v']).toEqual(['na', 'na']);
        expect(p['w']).toEqual(['na', -1]);
        expect(p['n']).toEqual([3, 2]);
    });
});
