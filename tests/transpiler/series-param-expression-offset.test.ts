// SPDX-License-Identifier: AGPL-3.0-only
// A history offset that is an expression on a function's series parameter, `src[n + 1]`,
// reads the bar `n + 1` bars ago, as on TradingView.

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

describe('expression history offset on a series parameter', () => {
    it('reads src[n + 1] inside an if condition', async () => {
        const values = await plotValues(
            [10, 20, 30, 40],
            `//@version=6
indicator("t")
f(src, n) =>
    float v = -1
    if src[n + 1] > 0
        v := src[n + 1]
    v
plot(f(close, 1), "p")`,
        );
        // Bars 0 and 1 have no bar two back (na > 0 is false): -1. Then close[2].
        expect(values).toEqual([-1, -1, 10, 20]);
    });

    it('reads src[n + 1] in an assignment', async () => {
        const values = await plotValues(
            [10, 20, 30, 40],
            `//@version=6
indicator("t")
f(src, n) =>
    src[n + 1]
plot(f(close, 1), "p")`,
        );
        expect(values.slice(2)).toEqual([10, 20]);
    });
});
