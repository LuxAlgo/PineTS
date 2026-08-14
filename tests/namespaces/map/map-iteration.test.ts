// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Regression: `for [k, v] in map` iterated 0 times even when the map
 * had entries. `for v in map` had the same shape of bug — Pine's
 * single-var iteration over a map yields [key, value] tuples but the
 * runtime returned an empty iterator.
 *
 * Root cause: `Context.iter()` and `Context.entries()` special-cased
 * PineArrayObject (via `source.array`) but never recognised
 * PineMapObject (whose data lives in `source.map` — a JS Map). With no
 * matching branch, the fallthrough returned `[].entries()` (empty).
 *
 * Discovered while debugging Swing-Structure-Scanner-LuxAlgo's table
 * rendering: `send_to_table` iterates `sorted_map` and writes per-pivot
 * tooltips/bgcolors, but the iteration body never ran, leaving the
 * table empty in the swing-data region.
 *
 * Fix: `iter()` returns `source.map` and `entries()` returns
 * `source.map.entries()` when the source is a PineMapObject.
 */

import { describe, expect, it } from 'vitest';
import { PineTS, Provider } from 'index';

const makePineTS = () =>
    new PineTS(Provider.Mock, 'BTCUSDC', 'D', null,
        new Date('2019-01-01').getTime(),
        new Date('2019-01-05').getTime());

describe('Map iteration — for [k,v] in map and for v in map', () => {
    it('`for [k,v] in m` iterates every entry of a populated PineMapObject', async () => {
        const code = `
//@version=5
indicator("for-k-v-in-map")
var m = map.new<int, float>()
if barstate.isfirst
    m.put(10, 1.5)
    m.put(20, 2.5)
    m.put(30, 3.5)

int n = 0
float sum_keys = 0.0
float sum_vals = 0.0
for [k, v] in m
    n += 1
    sum_keys += k
    sum_vals += v

plot(n,         "n")
plot(sum_keys,  "sk")
plot(sum_vals,  "sv")
`;
        const { plots } = await makePineTS().run(code);
        const last = (k: string) => {
            const d = plots[k]?.data;
            return d?.[d.length - 1]?.value;
        };
        expect(last('n')).toEqual(3);
        expect(last('sk')).toEqual(60);   // 10 + 20 + 30
        expect(last('sv')).toBeCloseTo(7.5, 6);  // 1.5 + 2.5 + 3.5
    });

    it('`for v in m` iterates the map and destructures the [key, value] pair', async () => {
        // Pine spec: `for v in m` where m is a map yields successive
        // [key, value] pair OBJECTS, NOT just values. The single-var
        // form is unusual; for typical use Pine users prefer `[k,v]`.
        // We at least verify the loop runs the right number of times.
        const code = `
//@version=5
indicator("for-v-in-map")
var m = map.new<int, int>()
if barstate.isfirst
    m.put(1, 11)
    m.put(2, 22)
    m.put(3, 33)
    m.put(4, 44)

int n = 0
for v in m
    n += 1

plot(n, "n")
`;
        const { plots } = await makePineTS().run(code);
        const data = plots['n'].data;
        expect(data[data.length - 1].value).toEqual(4);
    });

    it('iterating an empty map runs the loop body zero times', async () => {
        const code = `
//@version=5
indicator("empty-map")
var m = map.new<string, float>()
int n = 0
for [k, v] in m
    n += 1
plot(n, "n")
`;
        const { plots } = await makePineTS().run(code);
        const data = plots['n'].data;
        expect(data[data.length - 1].value).toEqual(0);
    });

    it('runtime: map created and iterated within the same bar (SSS shape)', async () => {
        // The Swing-Structure-Scanner failure case: the map is built
        // INSIDE `if barstate.islast` and iterated immediately. With
        // the bug, iteration returned 0 entries even though `size()`
        // reported the right count.
        const code = `
//@version=5
indicator("same-bar-map")
int n_iter = 0
int sz = 0
if barstate.islast
    m = map.new<int, int>()
    m.put(0, 100)
    m.put(1, 200)
    m.put(2, 300)
    sz := m.size()
    for [k, v] in m
        n_iter += 1
plot(n_iter, "n")
plot(sz,     "sz")
`;
        const { plots } = await makePineTS().run(code);
        const last = (k: string) => plots[k].data[plots[k].data.length - 1].value;
        expect(last('sz')).toEqual(3);
        expect(last('n')).toEqual(3);
    });
});
