// SPDX-License-Identifier: AGPL-3.0-only
// The `undefined` index argument of a generated `*.param(value, undefined, name)` call stays a
// bare `undefined`. It used to be one module-level AST node shared by every param call: a
// function whose return value is a ternary walks that node and wraps it in `$.get(…, 0)` in
// place, so every such function — in this script or in any script transpiled before it in the
// same process — added one more `$.get` around the index of every param call.

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { transpile } from '../../src/transpiler/index';

const MINUTE = 60_000;
const T0 = Date.UTC(2024, 0, 1);
const bars = (closes: number[]) =>
    closes.map((close, i) => ({
        openTime: T0 + i * MINUTE,
        closeTime: T0 + (i + 1) * MINUTE,
        open: i % 2 ? close - 1 : close + 1,
        high: close + 1,
        low: close - 1,
        close,
        volume: 1,
    }));

// `count` functions whose return value is a ternary holding a call on a parameter.
const script = (count: number) => {
    const lines = ['//@version=6', 'indicator("t")'];
    for (let i = 0; i < count; i++) lines.push(`f${i}(float x) => close > open ? math.max(x, ${i}) : na`);
    lines.push(`plot(${Array.from({ length: count }, (_, i) => `nz(f${i}(close))`).join(' + ')}, "p")`);
    return lines.join('\n');
};

describe('param call index argument', () => {
    it('is not re-wrapped by functions that return a ternary', () => {
        const js = transpile(script(5)).toString();
        expect(js).toContain("$.param('t', undefined, 'p0')");
        expect(js).not.toContain('$.get($.get(undefined');
    });

    it('transpiles the same script to the same code every time', () => {
        const first = transpile(script(3)).toString();
        expect(transpile(script(3)).toString()).toBe(first);
    });

    it('grows the generated code linearly with the number of such functions', () => {
        const perFunction = (count: number) => transpile(script(count)).toString().length / count;
        const small = perFunction(5);
        const large = perFunction(20);
        expect(large).toBeLessThan(small * 1.2);
    });

    it('computes the same values', async () => {
        const closes = [10, 12, 11, 13, 15, 14];
        const { plots } = await new PineTS(bars(closes), 'TEST', '1').run(script(3));
        // Bars where close > open (odd bars): max(close, 0) + max(close, 1) + max(close, 2).
        expect(plots['p'].data.map((d: any) => d.value)).toEqual(closes.map((c, i) => (i % 2 ? 3 * c : 0)));
    });
});
