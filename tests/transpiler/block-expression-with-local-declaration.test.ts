// SPDX-License-Identifier: AGPL-3.0-only
// An `if` used as a value keeps its value when a branch declares a local variable. The pineToJS
// codegen then emits `let x;` and assigns `x` from each branch; the declaration used to become
// `$.let.x = undefined`, and the branches' `$.set` (which writes into a Series) dropped the
// value. A `switch` goes through an IIFE instead and is covered here as a guard.

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Indicator } from '../../src/Indicator';

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

async function plotValues(closes: number[], source: string | Indicator, title = 'p') {
    const { plots } = await new PineTS(bars(closes), 'TEST', '1').run(source as any);
    return plots[title]?.data.map((d: any) => d.value);
}

const ifCode = `//@version=6
indicator("t")
useCalc = input.bool(true, "Calc")
int len = if useCalc and close > 0
    int calcBars = int(close * 2)
    math.max(6, calcBars)
else
    3
plot(len, "p")`;

describe('if / switch used as a value, with a local declared in a branch', () => {
    it('if: takes the value of the branch that declares it', async () => {
        // calcBars: 6, 10.
        expect(await plotValues([3, 5], ifCode)).toEqual([6, 10]);
    });

    it('if: takes the value of the other branch', async () => {
        expect(await plotValues([3, 5], new Indicator(ifCode, { Calc: false }))).toEqual([3, 3]);
    });

    it('switch: takes the value of an arm that declares a local', async () => {
        const values = await plotValues(
            [3, 5],
            `//@version=6
indicator("t")
x = switch
    close > 4 =>
        float d = close * 3
        d + 1
    => 0.0
plot(x, "p")`,
        );
        expect(values).toEqual([0, 16]);
    });

    it('if inside a function: keeps one value per call', async () => {
        const values = await plotValues(
            [3, 5],
            `//@version=6
indicator("t")
f(src, k) =>
    v = if src > 4
        float s = src * k
        s
    else
        -1.0
    v
plot(f(close, 2) + f(close, 10), "p")`,
        );
        expect(values).toEqual([-2, 60]);
    });
});
