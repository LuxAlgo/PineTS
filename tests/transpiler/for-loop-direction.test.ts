// SPDX-License-Identifier: AGPL-3.0-only
// A range loop `for i = a to b` fixes its direction when it starts, as on TradingView. Re-reading
// `a <= b` every iteration flips a count-down loop whose body shrinks `a`.

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

describe('range loop direction', () => {
    it('keeps counting down after the body shrinks the start expression', async () => {
        // The loop starts at 1 and counts down. After the body removes element 1, the
        // start expression `array.size(a) - 1` is 0, which must not turn the loop around.
        const values = await plotValues(
            [10, 20, 30],
            `//@version=6
indicator("t")
a = array.from(1, 2)
visited = 0
for i = array.size(a) - 1 to 0
    visited := visited * 10 + array.get(a, i)
    if i == 1
        array.remove(a, i)
plot(visited, "p")`,
        );
        expect(values).toEqual([21, 21, 21]);
    });

    it('still counts up, down and by a step', async () => {
        const pineTS = new PineTS(bars([10, 20, 30]), 'TEST', '1');
        const { plots } = await pineTS.run(`//@version=6
indicator("t")
up = 0
for i = 0 to 2
    up := up * 10 + i
down = 0
for i = 4 to 0 by 2
    down := down * 10 + i
plot(up, "up")
plot(down, "down")`);
        expect(plots['up'].data.map((d: any) => d.value)).toEqual([12, 12, 12]);
        expect(plots['down'].data.map((d: any) => d.value)).toEqual([420, 420, 420]);
    });
});
