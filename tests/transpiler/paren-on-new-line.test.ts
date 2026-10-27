// SPDX-License-Identifier: AGPL-3.0-only
// A `(` that opens a new line starts a new statement, as a `[` already does: after a `switch`
// or `if` used as a value, `(a and b) ? x : y` on the next line is the next statement (here the
// function's return value), not a call on the block expression.

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
    const { plots } = await new PineTS(bars(closes), 'TEST', '1').run(source);
    return plots[title].data.map((d: any) => d.value);
}

describe('parenthesized expression on the line after a block expression', () => {
    it('follows a switch expression', async () => {
        const values = await plotValues(
            [3, 5, 6, 8],
            `//@version=6
indicator("t")
grade(score, bonus) =>
    raw = switch
        score >= 6 => 3
        score >= 4 => 2
        => 1
    (raw == 3 and not bonus) ? 2 : raw
plot(grade(close, close > 7), "p")`,
        );
        // raw: 1, 2, 3, 3; the third bar has no bonus.
        expect(values).toEqual([1, 2, 2, 3]);
    });

    it('follows an if expression', async () => {
        const values = await plotValues(
            [3, 5, 6, 8],
            `//@version=6
indicator("t")
pick(x) =>
    v = if x > 5
        10
    else
        20
    (v > 15) ? -v : v
plot(pick(close), "p")`,
        );
        expect(values).toEqual([-20, -20, 10, 10]);
    });

    it('still lets a call wrap its arguments onto the next lines', async () => {
        const values = await plotValues(
            [3, 5, 6, 8],
            `//@version=6
indicator("t")
v = math.max(
     close,
     4)
plot(v, "p")`,
        );
        expect(values).toEqual([4, 5, 6, 8]);
    });
});
