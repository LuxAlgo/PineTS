// SPDX-License-Identifier: AGPL-3.0-only

/**
 * `na` handling in the window functions `ta.highest` / `ta.lowest` /
 * `ta.highestbars` / `ta.lowestbars` and in `ta.pivothigh` / `ta.pivotlow`.
 *
 * Expected values come from TradingView (tv-extractor, Sep 2026): the periodic
 * series below was evaluated on BINANCE:BTCUSDT 60 and every one of ~78 periods
 * agreed. Two rules explain every cell:
 *
 *   - Window functions RESET at `na`: only the bars since the most recent `na`
 *     (inclusive of none) take part. With `na` on the current bar `highest` /
 *     `lowest` return `na` and `highestbars` / `lowestbars` return `0`.
 *   - The pivot scan STOPS at `na`: bars beyond an `na` on either side are not
 *     examined, so a strictly higher bar behind an `na` does not disqualify a
 *     `pivothigh` candidate. An `na` candidate is never a pivot.
 *
 * Series (period 32, k = bar_index % 32, `na` at k = 4, 9, 13, 17, 21, 22, 29):
 *   k:   0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31
 *   val: 1  2  7  4 na  9  3  2  8 na  9  6  1 na  0  3  6 na  4  3  2 na na  6  8  7  2  1 10 na  9  5
 *
 * The disqualifying bars are deliberately placed BEYOND an `na` (k=10 is 9 behind
 * the na at k=9 for the candidate 8 at k=8; k=16 is 6 behind the na at k=17 for the
 * candidate 4 at k=18; k=28 is 10 behind the na at k=29 for the candidate 9 at k=30),
 * so "stop at na" is distinguishable from "na merely compares false".
 */
import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';

const PERIOD = 32;
const PATTERN = [1, 2, 7, 4, 0, 9, 3, 2, 8, 0, 9, 6, 1, 0, 0, 3, 6, 0, 4, 3, 2, 0, 0, 6, 8, 7, 2, 1, 10, 0, 9, 5];
const HOLES = [4, 9, 13, 17, 21, 22, 29];

// TradingView output per k. Copied verbatim from the extraction table.
const TV: Record<string, (number | 'na')[]> = {
    ph:   [9, 'na', 'na', 'na', 7, 'na', 'na', 9, 'na', 'na', 8, 'na', 9, 'na', 'na', 'na', 'na', 'na', 6, 'na', 4, 'na', 'na', 'na', 'na', 'na', 8, 'na', 'na', 'na', 10, 'na'],
    pl:   ['na', 'na', 1, 'na', 'na', 'na', 'na', 'na', 'na', 2, 'na', 'na', 'na', 'na', 1, 'na', 0, 'na', 'na', 'na', 'na', 'na', 2, 'na', 'na', 6, 'na', 'na', 'na', 1, 'na', 'na'],
    ph11: ['na', 'na', 'na', 7, 'na', 'na', 9, 'na', 'na', 8, 'na', 9, 'na', 'na', 'na', 'na', 'na', 6, 'na', 4, 'na', 'na', 'na', 'na', 'na', 8, 'na', 'na', 'na', 10, 'na', 9],
    pl11: ['na', 1, 'na', 'na', 4, 'na', 'na', 'na', 2, 'na', 'na', 'na', 'na', 1, 'na', 0, 'na', 'na', 'na', 'na', 'na', 2, 'na', 'na', 6, 'na', 'na', 'na', 1, 'na', 'na', 'na'],
    ph33: ['na', 9, 'na', 'na', 'na', 7, 'na', 'na', 9, 'na', 'na', 'na', 'na', 9, 'na', 'na', 'na', 'na', 'na', 6, 'na', 4, 'na', 'na', 'na', 'na', 'na', 8, 'na', 'na', 'na', 10],
    pl33: ['na', 'na', 'na', 1, 'na', 'na', 'na', 'na', 'na', 'na', 2, 'na', 'na', 'na', 'na', 1, 'na', 0, 'na', 'na', 'na', 'na', 'na', 2, 'na', 'na', 'na', 'na', 'na', 'na', 1, 'na'],
    hb5:  [-2, -3, -4, -1, 0, 0, -1, -2, -3, 0, 0, -1, -2, 0, 0, 0, 0, 0, 0, -1, -2, 0, 0, 0, 0, -1, -2, -3, 0, 0, 0, -1],
    lb5:  [0, -1, -2, -3, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, -1, -2, 0, 0, 0, 0, 0, 0, 0, -1, -2, 0, 0, -1, 0, 0, 0],
    hb3:  [-2, -2, 0, -1, 0, 0, -1, -2, 0, 0, 0, -1, -2, 0, 0, 0, 0, 0, 0, -1, -2, 0, 0, 0, 0, -1, -2, -2, 0, 0, 0, -1],
    lb3:  [0, -1, -2, -2, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, -1, -2, 0, 0, 0, 0, 0, 0, 0, -1, -2, 0, 0, -1, 0, 0, 0],
    h5:   [9, 9, 9, 7, 'na', 9, 9, 9, 9, 'na', 9, 9, 9, 'na', 0, 3, 6, 'na', 4, 4, 4, 'na', 'na', 6, 8, 8, 8, 8, 10, 'na', 9, 9],
    l5:   [1, 1, 1, 1, 'na', 9, 3, 2, 2, 'na', 9, 6, 1, 'na', 0, 0, 0, 'na', 4, 3, 2, 'na', 'na', 6, 6, 6, 2, 1, 1, 'na', 9, 5],
};

const SCRIPT = `//@version=6
indicator("na window semantics", overlay=false)
var float[] pat = array.from(${PATTERN.map((v, i) => (i === 0 ? `${v}.` : v)).join(', ')})
int k = bar_index % ${PERIOD}
bool hole = ${HOLES.map((h) => `k == ${h}`).join(' or ')}
float src = hole ? na : array.get(pat, k)
plot(k, "k")
plot(ta.pivothigh(src, 2, 2), "ph")
plot(ta.pivotlow(src, 2, 2), "pl")
plot(ta.pivothigh(src, 1, 1), "ph11")
plot(ta.pivotlow(src, 1, 1), "pl11")
plot(ta.pivothigh(src, 3, 3), "ph33")
plot(ta.pivotlow(src, 3, 3), "pl33")
plot(ta.highestbars(src, 5), "hb5")
plot(ta.lowestbars(src, 5), "lb5")
plot(ta.highestbars(src, 3), "hb3")
plot(ta.lowestbars(src, 3), "lb3")
plot(ta.highest(src, 5), "h5")
plot(ta.lowest(src, 5), "l5")
`;

function syntheticBars(n: number) {
    const H = 3_600_000;
    const t0 = Date.UTC(2024, 0, 1);
    return Array.from({ length: n }, (_, i) => ({
        openTime: t0 + i * H,
        closeTime: t0 + (i + 1) * H,
        open: 100,
        high: 101,
        low: 99,
        close: 100,
        volume: 1,
    }));
}

async function runByK() {
    const { plots } = await new PineTS(syntheticBars(4 * PERIOD), 'SYN', '60').run(SCRIPT);
    const byK: Record<string, (number | 'na')[]> = {};
    const k = plots['k'].data.map((p) => p.value);
    for (const name of Object.keys(TV)) {
        byK[name] = new Array(PERIOD).fill(undefined);
        const v = plots[name].data.map((p) => p.value);
        // skip the first period so every lookback is fully warmed up; `+ 0` folds -0 into 0
        for (let i = PERIOD; i < v.length; i++) byK[name][k[i]] = Number.isNaN(v[i]) ? 'na' : v[i] + 0;
    }
    return byK;
}

describe('ta.highest / ta.lowest / ta.highestbars / ta.lowestbars reset at na (TradingView parity)', () => {
    it('only bars since the most recent na take part; na on the current bar → na / 0', async () => {
        const byK = await runByK();
        // window at k=5 is [2, 7, 4, na, 9] → only the 9 counts
        expect(byK.h5[5]).toBe(9);
        expect(byK.l5[5]).toBe(9);
        expect(byK.hb5[5]).toBe(0);
        expect(byK.lb5[5]).toBe(0);
        // window at k=20 is [6, na, 4, 3, 2] → 4 at -2 is the highest, not the 6 behind the na
        expect(byK.h5[20]).toBe(4);
        expect(byK.hb5[20]).toBe(-2);
        // na on the current bar
        expect(byK.h5[4]).toBe('na');
        expect(byK.l5[4]).toBe('na');
        expect(byK.hb5[4]).toBe(0);
        expect(byK.lb5[4]).toBe(0);
        for (const name of ['h5', 'l5', 'hb5', 'lb5', 'hb3', 'lb3']) expect(byK[name], name).toEqual(TV[name]);
    });
});

describe('ta.pivothigh / ta.pivotlow stop scanning at na (TradingView parity)', () => {
    it('a disqualifying bar behind an na does not count; an na candidate is never a pivot', async () => {
        const byK = await runByK();
        expect(byK.ph[10]).toBe(8); // candidate 8 at k=8: right side is [na, 9] → the 9 is never seen
        expect(byK.pl[14]).toBe(1); // candidate 1 at k=12: right side is [na, 0]
        expect(byK.ph[20]).toBe(4); // candidate 4 at k=18: left side is [na, 6]
        expect(byK.ph[0]).toBe(9); // candidate 9 at k=30: left side is [na, 10]
        expect(byK.ph[6]).toBe('na'); // candidate at k=4 is na
        for (const name of ['ph', 'pl', 'ph11', 'pl11', 'ph33', 'pl33']) expect(byK[name], name).toEqual(TV[name]);
    });
});
