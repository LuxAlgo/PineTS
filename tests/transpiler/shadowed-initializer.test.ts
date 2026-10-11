// SPDX-License-Identifier: AGPL-3.0-only
// A declaration in an inner block that reuses an outer variable's name reads the outer variable
// in its initializer, as on TradingView: `x = x + 1` inside an `if` declares a new local `x` that
// starts from the outer `x`.

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';

const MINUTE = 60_000;
const T0 = Date.UTC(2024, 0, 1);
const bars = (closes: number[]) =>
    closes.map((close, i) => ({
        openTime: T0 + i * MINUTE,
        closeTime: T0 + (i + 1) * MINUTE,
        open: close,
        high: close,
        low: close,
        close,
        volume: 1,
    }));

async function plotValues(closes: number[], source: string, title = 'p') {
    const pineTS = new PineTS(bars(closes), 'TEST', '1');
    const { plots } = await pineTS.run(source);
    return plots[title].data.map((d: any) => d.value);
}

describe('shadowing declaration initializer', () => {
    it('reads the outer variable in an if block', async () => {
        const values = await plotValues(
            [10, 20, 30],
            `//@version=6
indicator("t")
x = 10
y = 0
if bar_index >= 0
    x = x + 1
    y := x
plot(y, "p")`,
        );
        expect(values).toEqual([11, 11, 11]);
    });

    it('leaves the outer variable unchanged', async () => {
        const values = await plotValues(
            [10, 20, 30],
            `//@version=6
indicator("t")
x = 10
if bar_index >= 0
    float x = x * 2
plot(x, "p")`,
        );
        expect(values).toEqual([10, 10, 10]);
    });

    it('reads the outer variable in a function body and a loop body', async () => {
        const pineTS = new PineTS(bars([10, 20, 30]), 'TEST', '1');
        const { plots } = await pineTS.run(`//@version=6
indicator("t")
x = 10
f() =>
    x = x + 1
    x
y = 0
for i = 0 to 1
    x = x + i
    y := y + x
plot(f(), "fn")
plot(y, "loop")`);
        expect(plots['fn'].data.map((d: any) => d.value)).toEqual([11, 11, 11]);
        expect(plots['loop'].data.map((d: any) => d.value)).toEqual([21, 21, 21]);
    });
});
