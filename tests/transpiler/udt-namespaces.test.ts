// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * UDT declarations that TradingView accepts but the Pine → JS stage used to reject:
 *
 * - `varip` before a field type (`varip float p`), used by tick-based scripts.
 * - A UDT and a function sharing a name (`type level` + `level(...) => ...`).
 *   Pine keeps types and functions in separate namespaces; `level.new()` is the
 *   type and `level(...)` is the function.
 *
 * Expected values are derived by hand from the scripts' Pine semantics.
 */

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

const script = (body: string) => `//@version=6\nindicator("udt namespaces")\n${body}\n`;

async function run(body: string) {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-03').getTime());
    const { plots } = await pineTS.run(script(body));
    return plots;
}

function values(plots: any, title: string): number[] {
    expect(plots[title], `plot "${title}" missing`).toBeDefined();
    return plots[title].data.map((d: any) => d.value);
}

describe('UDT fields declared with varip', () => {
    it('accepts varip fields and keeps their values like regular fields', async () => {
        const plots = await run(`
type bin
    varip float p
    varip float v = 2
var bin acc = bin.new(na, 0)
acc.v += 1
b = bin.new(close)
plot(acc.v, "count")
plot(b.v, "default")
plot(b.p - close, "diff")
`);
        const count = values(plots, 'count');
        expect(count.length).toBeGreaterThan(1);
        // `var` object: incremented once per bar -> 1, 2, 3, ...
        count.forEach((v, i) => expect(v).toBe(i + 1));
        values(plots, 'default').forEach((v) => expect(v).toBe(2));
        values(plots, 'diff').forEach((v) => expect(v).toBe(0));
    });

    it('accepts varip before a generic field type', async () => {
        const plots = await run(`
type Dom
    varip map<float, float> totalVolume
    varip array<float> prices
var Dom dom = Dom.new(map.new<float, float>(), array.new<float>())
dom.totalVolume.put(1.0, nz(dom.totalVolume.get(1.0)) + 1)
dom.prices.push(close)
plot(dom.totalVolume.get(1.0), "vol")
plot(dom.prices.size(), "n")
`);
        values(plots, 'vol').forEach((v, i) => expect(v).toBe(i + 1));
        values(plots, 'n').forEach((v, i) => expect(v).toBe(i + 1));
    });
});

describe('A UDT and a function sharing a name', () => {
    const LEVEL = `
type level
    float multiplier
    string levelStyle = "solid"

level(float m, float scale = 10) => m * scale

var array<level> levels = array.new<level>()
if barstate.isfirst
    levels.push(level.new(2))
    levels.push(level.new(3, "dotted"))
`;

    it('resolves `level.new()` to the type and `level(...)` to the function', async () => {
        const plots = await run(`${LEVEL}
l = levels.get(1)
plot(levels.size(), "size")
plot(l.multiplier, "mult")
plot(level(l.multiplier), "fn")
plot(level(m = 4, scale = 0.5), "named")
plot(l.levelStyle == "dotted" ? 1 : 0, "style")
`);
        values(plots, 'size').forEach((v) => expect(v).toBe(2));
        values(plots, 'mult').forEach((v) => expect(v).toBe(3));
        values(plots, 'fn').forEach((v) => expect(v).toBe(30));
        values(plots, 'named').forEach((v) => expect(v).toBe(2));
        values(plots, 'style').forEach((v) => expect(v).toBe(1));
    });

    it('keeps `level.copy()` and UDT-typed parameters pointing at the type', async () => {
        const plots = await run(`${LEVEL}
double(level x) => x.multiplier * 2
original = levels.get(0)
copied = level.copy(original)
copied.multiplier := 7
plot(original.multiplier, "orig")
plot(copied.multiplier, "copy")
plot(double(copied), "double")
`);
        values(plots, 'orig').forEach((v) => expect(v).toBe(2));
        values(plots, 'copy').forEach((v) => expect(v).toBe(7));
        values(plots, 'double').forEach((v) => expect(v).toBe(14));
    });

    it('works when the function is declared before the type', async () => {
        const plots = await run(`
zone(float top, float bottom) => top - bottom
type zone
    float top
    float bottom
z = zone.new(close + 5, close - 3)
plot(zone(z.top, z.bottom), "height")
`);
        values(plots, 'height').forEach((v) => expect(v).toBeCloseTo(8, 8));
    });
});
