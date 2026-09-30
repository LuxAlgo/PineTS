// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Untitled plots are keyed by their call site ("#N"), as untitled plot()
 * always was. bgcolor(), barcolor(), plotchar(), plotshape(), plotarrow(),
 * plotbar() and plotcandle() are called as bare functions, so the transpiler
 * didn't give them a call-site id: every untitled call of any of them shared
 * the key "plot", with interleaved data (N calls → N × bars entries) and the
 * first call's options. Titled calls keep their title as the key.
 */

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';

const DAY = 86_400_000;
const START = Date.UTC(2024, 0, 1);
const BARS = 20;

const candles = Array.from({ length: BARS }, (_, i) => {
    const up = i % 2 === 0;
    return { openTime: START + i * DAY, closeTime: START + (i + 1) * DAY - 1, open: up ? 100 : 102, high: 103, low: 99, close: up ? 102 : 100, volume: 1000 };
});

async function plotsOf(code: string) {
    const pineTS = new PineTS(candles as any);
    return (await pineTS.run(code)).plots as Record<string, any>;
}

describe('untitled bare plot calls get call-site keys', () => {
    it('bgcolor() and barcolor() each get their own key and one entry per bar', async () => {
        const plots = await plotsOf(`//@version=5
indicator("x", overlay=true)
bgcolor(close > open ? color.green : na)
barcolor(close < open ? color.red : na)
bgcolor(close < open ? color.blue : na, force_overlay=true)
`);
        expect(plots['plot']).toBeUndefined();
        const bgs = Object.values(plots).filter((p) => p.options?.style === 'background');
        const bars = Object.values(plots).filter((p) => p.options?.style === 'barcolor');
        expect(bgs).toHaveLength(2);
        expect(bars).toHaveLength(1);
        for (const p of [...bgs, ...bars]) {
            expect(p._plotKey).toMatch(/^#\d+$/);
            expect(p.data).toHaveLength(BARS);
        }
        // Each keeps its own options and colours.
        const [bg1, bg2] = bgs;
        expect(bg1.options.force_overlay).toBeUndefined();
        expect(bg2.options.force_overlay).toBe(true);
        expect(bg1.data[0].options.color).toMatch(/^#4caf50/i); // bar 0 is up → green
        expect(bg1.data[1].value).toBeFalsy();
        expect(bg2.data[1].options.color).toMatch(/^#2962ff/i); // bar 1 is down → blue
        expect(bars[0].data[1].options.color).toMatch(/^#f23645/i);
    });

    it('titled bgcolor() / barcolor() keep their title as the key', async () => {
        const plots = await plotsOf(`//@version=5
indicator("x", overlay=true)
bgcolor(close > open ? color.green : na, title="Up")
barcolor(close < open ? color.red : na, title="Down")
`);
        expect(Object.keys(plots)).toEqual(expect.arrayContaining(['Up', 'Down']));
        expect(plots['Up'].data).toHaveLength(BARS);
        expect(plots['Down'].data).toHaveLength(BARS);
    });

    it('untitled plotchar() / plotshape() calls no longer share one key', async () => {
        const plots = await plotsOf(`//@version=5
indicator("x", overlay=true)
plotchar(close > open, char="u")
plotchar(close < open, char="d")
plotshape(close > open, style=shape.circle)
plotshape(close < open, style=shape.square)
`);
        expect(plots['plot']).toBeUndefined();
        const chars = Object.values(plots).filter((p) => p.options?.style === 'char');
        const shapes = Object.values(plots).filter((p) => p.options?.style === 'shape');
        expect(chars.map((p) => p.options.char)).toEqual(['u', 'd']);
        expect(shapes.map((p) => p.options.shape)).toEqual(['shape_circle', 'shape_square']);
        for (const p of [...chars, ...shapes]) expect(p.data).toHaveLength(BARS);
    });
});
