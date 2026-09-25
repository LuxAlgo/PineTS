// SPDX-License-Identifier: AGPL-3.0-only

/**
 * `na` handling in `ta.range`.
 *
 * `ta.range` is NOT `ta.highest - ta.lowest`: those two reset at `na`
 * (tests/namespaces/ta/na-window-semantics.test.ts), while `ta.range` skips `na`
 * entirely. Expected values match TradingView (Sep 2026); three rules explain
 * every cell:
 *
 *   - The window holds the last `length` NON-na values; an `na` bar is not added,
 *     so the result on an `na` bar repeats the previous one.
 *   - The result is `na` until `length` non-na values have been seen.
 *   - The maximum starts from the smallest positive double rather than -∞, so a
 *     window of negative values measures down from 0: range(-5, 1) = 5.
 */
import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';

type Cell = number | 'na';

// Positive series (period 32, na at k = 4, 9, 13, 17, 21, 22, 29)
const POS_PERIOD = 32;
const POS_PATTERN = [1, 2, 7, 4, 0, 9, 3, 2, 8, 0, 9, 6, 1, 0, 0, 3, 6, 0, 4, 3, 2, 0, 0, 6, 8, 7, 2, 1, 10, 0, 9, 5];
const POS_HOLES = [4, 9, 13, 17, 21, 22, 29];

// Negative series (period 12, na at k = 2, 5, 6, 7, 11)
const NEG_PERIOD = 12;
const NEG_PATTERN = [-5, -3, 0, -8, -1, 0, 0, 0, -2, 4, -6, 0];
const NEG_HOLES = [2, 5, 6, 7, 11];

// TradingView output per k, after warm-up.
const TV_POS: Record<string, Cell[]> = {
    // k=14 (value 0, length 1): TradingView prints 5e-324, the smallest positive double minus 0
    r1: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5e-324, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    r3: [8, 4, 6, 5, 5, 5, 6, 7, 6, 6, 7, 3, 8, 8, 6, 3, 6, 6, 3, 3, 2, 2, 2, 4, 6, 2, 6, 6, 9, 9, 9, 5],
    r5: [9, 9, 8, 6, 6, 8, 7, 7, 7, 7, 7, 7, 8, 8, 9, 9, 6, 6, 6, 6, 4, 4, 4, 4, 6, 6, 6, 7, 9, 9, 9, 9],
    r8: [9, 9, 9, 9, 9, 9, 8, 8, 8, 8, 7, 7, 8, 8, 9, 9, 9, 9, 9, 9, 6, 6, 6, 6, 8, 6, 6, 7, 9, 9, 9, 9],
};
const TV_NEG: Record<string, Cell[]> = {
    n1: [5, 3, 3, 8, 1, 1, 1, 1, 2, 0, 6, 6],
    n3: [10, 6, 6, 8, 8, 8, 8, 8, 8, 6, 10, 10],
    n5: [10, 10, 10, 12, 8, 8, 8, 8, 8, 12, 12, 12],
};
// TradingView output on bar_index 0..9 (warm-up counts non-na values)
const TV_HEAD: Record<string, Cell[]> = {
    n1: [5, 3, 3, 8, 1, 1, 1, 1, 2, 0],
    n3: ['na', 'na', 'na', 8, 8, 8, 8, 8, 8, 6],
    n5: ['na', 'na', 'na', 'na', 'na', 'na', 'na', 'na', 8, 12],
    // source is na on bar_index 0..2, then bar_index % 4
    q1: ['na', 'na', 'na', 0, 0, 0, 0, 0, 0, 0],
    q3: ['na', 'na', 'na', 'na', 'na', 3, 2, 2, 3, 3],
    allna: ['na', 'na', 'na', 'na', 'na', 'na', 'na', 'na', 'na', 'na'],
};

const holed = (name: string, period: number, pattern: number[], holes: number[]) =>
    `var float[] ${name}Pat = array.from(${pattern.map((v, i) => (i === 0 ? `${v}.` : v)).join(', ')})
int ${name}K = bar_index % ${period}
float ${name} = ${holes.map((h) => `${name}K == ${h}`).join(' or ')} ? na : array.get(${name}Pat, ${name}K)`;

const SCRIPT = `//@version=6
indicator("ta.range na semantics", overlay=false)
${holed('pos', POS_PERIOD, POS_PATTERN, POS_HOLES)}
${holed('neg', NEG_PERIOD, NEG_PATTERN, NEG_HOLES)}
float lead = bar_index < 3 ? na : bar_index % 4
float nothing = na
plot(posK, "posK")
plot(negK, "negK")
plot(ta.range(pos, 1), "r1")
plot(ta.range(pos, 3), "r3")
plot(ta.range(pos, 5), "r5")
plot(ta.range(pos, 8), "r8")
plot(ta.range(neg, 1), "n1")
plot(ta.range(neg, 3), "n3")
plot(ta.range(neg, 5), "n5")
plot(ta.range(lead, 1), "q1")
plot(ta.range(lead, 3), "q3")
plot(ta.range(nothing, 3), "allna")
plot(ta.highest(pos, 5) - ta.lowest(pos, 5), "hl5")
float last5 = na
if barstate.islast
    last5 := ta.range(pos, 5)
plot(last5, "last5")
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

const toCell = (v: number): Cell => (Number.isNaN(v) ? 'na' : v + 0);

async function run() {
    const { plots } = await new PineTS(syntheticBars(4 * POS_PERIOD), 'SYN', '60').run(SCRIPT);
    const values = (name: string) => plots[name].data.map((p) => p.value as number);
    // skip the first period so every window is fully warmed up
    const byK = (names: string[], kPlot: string, period: number) => {
        const k = values(kPlot);
        const out: Record<string, Cell[]> = {};
        for (const name of names) {
            out[name] = new Array(period).fill(undefined);
            const v = values(name);
            for (let i = POS_PERIOD; i < v.length; i++) out[name][k[i]] = toCell(v[i]);
        }
        return out;
    };
    return { values, pos: byK(Object.keys(TV_POS), 'posK', POS_PERIOD), neg: byK(Object.keys(TV_NEG), 'negK', NEG_PERIOD) };
}

function expectCells(actual: Cell[], expected: Cell[], label: string) {
    expect(actual.length, label).toBe(expected.length);
    expected.forEach((e, i) => {
        if (e === 'na') expect(actual[i], `${label}[${i}]`).toBe('na');
        else expect(actual[i], `${label}[${i}]`).toBeCloseTo(e, 9);
    });
}

describe('ta.range skips na (TradingView parity)', () => {
    it('uses the last `length` non-na values and holds its value on na bars', async () => {
        const { pos } = await run();
        // k=5: last 5 non-na values are [1, 2, 7, 4, 9] → 8 (highest - lowest resets at the na at k=4 → 0)
        expect(pos.r5[5]).toBe(8);
        // k=4 is na: the window is unchanged from k=3 → 6, not na
        expect(pos.r5[4]).toBe(6);
        expect(pos.r1[4]).toBe(0);
        for (const name of Object.keys(TV_POS)) expectCells(pos[name], TV_POS[name], name);
    });

    it('measures negative windows from 0', async () => {
        const { neg } = await run();
        // k=1: last 3 non-na values are [-6, -5, -3] → 0 - (-6) = 6
        expect(neg.n3[1]).toBe(6);
        expect(neg.n1[0]).toBe(5);
        for (const name of Object.keys(TV_NEG)) expectCells(neg[name], TV_NEG[name], name);
    });

    it('is na until `length` non-na values have been seen', async () => {
        const { values } = await run();
        for (const name of Object.keys(TV_HEAD)) expectCells(values(name).slice(0, 10).map(toCell), TV_HEAD[name], name);
    });

    it('leaves ta.highest / ta.lowest resetting at na', async () => {
        const { values } = await run();
        const hl5 = values('hl5');
        // k=5 of the second period (bar 37): highest and lowest only see the 9 after the na at k=4
        expect(hl5[POS_PERIOD + 5]).toBe(0);
        expect(Number.isNaN(hl5[POS_PERIOD + 4])).toBe(true);
    });

    it('backfills from the source history when first called late (barstate.islast)', async () => {
        const { values } = await run();
        const last = values('last5').length - 1;
        expect(values('last5')[last]).toBe(values('r5')[last]);
    });
});
