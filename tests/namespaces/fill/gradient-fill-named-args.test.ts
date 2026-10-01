// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Gradient fill() arguments given by name after positional ones.
 *
 * The gradient branch of FillHelper.any only read a positional string title
 * at args[6]; the transpiler passes named arguments as a trailing object, so
 * `fill(a, b, 100, 90, color.green, color.red, title="Grad2")` lost its title
 * (key "fill") and `display=` / `fillgaps=` / `editable=` were dropped. A
 * gradient given partly by name (`fill(a, b, 100, 90, top_color=…,
 * bottom_color=…)`) wasn't recognised as a gradient at all.
 */

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';

const DAY = 86_400_000;
const START = Date.UTC(2024, 0, 1);
const BARS = 10;
const candles = Array.from({ length: BARS }, (_, i) => ({
    openTime: START + i * DAY, closeTime: START + (i + 1) * DAY - 1, open: 95, high: 110, low: 90, close: 95 + i, volume: 1,
}));

async function plotsOf(body: string) {
    const ctx = await new PineTS(candles as any, 'AAA', 'D').run(`//@version=5
indicator("fills")
a = plot(high, "a")
b = plot(low, "b")
${body}`);
    return ctx.plots as Record<string, any>;
}

const fills = (plots: Record<string, any>) => Object.entries(plots).filter(([, p]) => p.options?.style === 'fill');

describe('gradient fill() with named arguments', () => {
    it('a named title keys the fill, like a positional one', async () => {
        const plots = await plotsOf(`fill(a, b, 100, 90, color.green, color.red, "Grad")
fill(a, b, 100, 90, color.green, color.red, title="Grad2")`);
        expect(fills(plots).map(([k]) => k)).toEqual(['Grad', 'Grad2']);
        expect(plots['Grad2'].options.gradient).toBe(true);
        expect(plots['Grad2'].title).toBe('Grad2');
        expect(plots['Grad2'].data).toHaveLength(BARS);
        expect(plots['Grad2'].data[0].options).toMatchObject({ top_value: 100, bottom_value: 90 });
    });

    it('named colours after positional values make a gradient fill', async () => {
        const plots = await plotsOf(`fill(a, b, 100, 90, top_color=color.green, bottom_color=color.red, title="G3")`);
        expect(plots['G3']).toBeDefined();
        expect(plots['G3'].options.gradient).toBe(true);
        expect(plots['G3'].data[0].options.top_color).toMatch(/^#4caf50/i);
        expect(plots['G3'].data[0].options.bottom_color).toMatch(/^#f23645/i);
    });

    it('named display / fillgaps reach the gradient fill options', async () => {
        const plots = await plotsOf(`fill(a, b, 100, 90, color.green, color.red, "Hidden", display=display.none, fillgaps=true)`);
        expect(plots['Hidden'].options.display).toBe('none');
        expect(plots['Hidden'].options.fillgaps).toBe(true);
    });

    it('all-named gradient and plain fills keep working', async () => {
        const plots = await plotsOf(`fill(a, b, top_value=100, bottom_value=90, top_color=color.green, bottom_color=color.red, title="AllNamed")
fill(a, b, color.red, title="Plain")`);
        expect(plots['AllNamed'].options.gradient).toBe(true);
        expect(plots['AllNamed'].data[0].options).toMatchObject({ top_value: 100, bottom_value: 90 });
        expect(plots['Plain'].options.gradient).toBeUndefined();
        expect(plots['Plain'].data[0].options.color).toMatch(/^#f23645/i);
    });
});
