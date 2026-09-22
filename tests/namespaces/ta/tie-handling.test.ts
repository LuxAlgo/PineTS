// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Tie handling in `ta.pivothigh` / `ta.pivotlow` and `ta.highestbars` / `ta.lowestbars`.
 *
 * Expected values come from TradingView (Sep 2026): the periodic series
 * below was evaluated on BINANCE:BTCUSDT 60 and every one of ~89 periods agreed.
 *
 *   - Pivots are ASYMMETRIC. A bar equal to the candidate on the LEFT does not
 *     disqualify it (only a strictly higher / lower left bar does); a bar equal to the
 *     candidate on the RIGHT does disqualify it — the later equal bar becomes the pivot.
 *   - `highestbars` / `lowestbars` return the offset of the OLDEST bar among ties.
 *
 * Series (period 28, k = bar_index % 28):
 *   k:   0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27
 *   val: 1  2  7  4  7  3  2  3  3  5  9  6  4  3  9  8  2  5  2  6  7  8  6  1  5  7  8  8
 */
import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';

const PERIOD = 28;
const PATTERN = [1, 2, 7, 4, 7, 3, 2, 3, 3, 5, 9, 6, 4, 3, 9, 8, 2, 5, 2, 6, 7, 8, 6, 1, 5, 7, 8, 8];

// TradingView output per k (na = NaN). Copied verbatim from the extraction table.
const TV: Record<string, (number | 'na')[]> = {
    ph:   ['na', 8, 'na', 'na', 'na', 'na', 7, 'na', 'na', 'na', 'na', 'na', 9, 'na', 'na', 'na', 9, 'na', 'na', 'na', 'na', 'na', 'na', 8, 'na', 'na', 'na', 'na'],
    pl:   ['na', 'na', 1, 'na', 'na', 'na', 'na', 'na', 2, 'na', 'na', 'na', 'na', 'na', 'na', 3, 'na', 'na', 'na', 'na', 2, 'na', 'na', 'na', 'na', 1, 'na', 'na'],
    ph11: [8, 'na', 'na', 7, 'na', 7, 'na', 'na', 'na', 'na', 'na', 9, 'na', 'na', 'na', 9, 'na', 'na', 5, 'na', 'na', 'na', 8, 'na', 'na', 'na', 'na', 'na'],
    pl11: ['na', 1, 'na', 'na', 4, 'na', 'na', 2, 'na', 3, 'na', 'na', 'na', 'na', 3, 'na', 'na', 2, 'na', 2, 'na', 'na', 'na', 'na', 1, 'na', 'na', 'na'],
    hb5:  [-2, -3, -4, -4, -2, -3, -4, -3, -4, 0, 0, -1, -2, -3, -4, -1, -2, -3, -4, -4, 0, 0, -1, -2, -3, -4, 0, -1],
    lb5:  [0, -1, -2, -3, -4, -4, 0, -1, -2, -3, -4, -4, -4, 0, -1, -2, 0, -1, -2, -3, -4, -3, -4, 0, -1, -2, -3, -4],
    hb3:  [-2, -2, 0, -1, -2, -1, -2, -2, -1, 0, 0, -1, -2, -2, 0, -1, -2, -2, -1, 0, 0, 0, -1, -2, -2, 0, 0, -1],
    lb3:  [0, -1, -2, -2, -1, 0, 0, -1, -2, -2, -2, -2, 0, 0, -1, -2, 0, -1, -2, -1, -2, -2, 0, 0, -1, -2, -2, -2],
};

const SCRIPT = `//@version=6
indicator("tie semantics", overlay=false)
var float[] pat = array.from(${PATTERN.map((v, i) => (i === 0 ? `${v}.` : v)).join(', ')})
int k = bar_index % ${PERIOD}
float src = array.get(pat, k)
plot(k, "k")
plot(ta.pivothigh(src, 2, 2), "ph")
plot(ta.pivotlow(src, 2, 2), "pl")
plot(ta.pivothigh(src, 1, 1), "ph11")
plot(ta.pivotlow(src, 1, 1), "pl11")
plot(ta.highestbars(src, 5), "hb5")
plot(ta.lowestbars(src, 5), "lb5")
plot(ta.highestbars(src, 3), "hb3")
plot(ta.lowestbars(src, 3), "lb3")
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
    for (const name of Object.keys(TV)) {
        byK[name] = new Array(PERIOD).fill(undefined);
        const k = plots['k'].data.map((p) => p.value);
        const v = plots[name].data.map((p) => p.value);
        // skip the first period so every lookback is fully warmed up
        // `+ 0` folds the `-0` that `-offset` yields at offset 0 (toEqual distinguishes -0 from 0)
        for (let i = PERIOD; i < v.length; i++) byK[name][k[i]] = Number.isNaN(v[i]) ? 'na' : v[i] + 0;
    }
    return byK;
}

describe('ta.pivothigh / ta.pivotlow tie handling (TradingView parity)', () => {
    it('a LEFT bar equal to the candidate does not disqualify it; a RIGHT equal bar does', async () => {
        const byK = await runByK();
        // spot checks that name the semantics, then the full table
        expect(byK.ph[6]).toBe(7); // candidate k=4 (7), left tie with k=2 → pivot
        expect(byK.ph[4]).toBe('na'); // candidate k=2 (7), right tie with k=4 → not a pivot
        expect(byK.pl[20]).toBe(2); // candidate k=18 (2), left tie with k=16 → pivot
        expect(byK.pl[18]).toBe('na'); // candidate k=16 (2), right tie with k=18 → not a pivot
        expect(byK.ph11[0]).toBe(8); // candidate k=27 (8), left tie with k=26 → pivot
        expect(byK.ph11[27]).toBe('na'); // candidate k=26 (8), right tie with k=27 → not a pivot
        for (const name of ['ph', 'pl', 'ph11', 'pl11']) expect(byK[name], name).toEqual(TV[name]);
    });

    it('2-argument form (source defaults to high / low) uses the same rules', async () => {
        // high plateau 105,105 then lower; low plateau 95,95 then higher
        const H = 3_600_000;
        const t0 = Date.UTC(2024, 0, 1);
        const highs = [100, 101, 105, 105, 102, 100, 100, 100];
        const lows = [96, 97, 95, 95, 98, 99, 99, 99];
        const bars = highs.map((h, i) => ({ openTime: t0 + i * H, closeTime: t0 + (i + 1) * H, open: 100, high: h, low: lows[i], close: 100, volume: 1 }));
        const { plots } = await new PineTS(bars, 'SYN', '60').run(`//@version=6
indicator("t")
plot(ta.pivothigh(1, 1), "ph")
plot(ta.pivotlow(1, 1), "pl")`);
        const ph = plots['ph'].data.map((p) => p.value);
        const pl = plots['pl'].data.map((p) => p.value);
        // bar 2 (first 105) has a right tie → na (reported at bar 3); bar 3 has a left tie → pivot (reported at bar 4)
        expect(Number.isNaN(ph[3])).toBe(true);
        expect(ph[4]).toBe(105);
        expect(Number.isNaN(pl[3])).toBe(true);
        expect(pl[4]).toBe(95);
    });
});

describe('ta.highestbars / ta.lowestbars tie handling (TradingView parity)', () => {
    it('returns the offset of the OLDEST bar among ties', async () => {
        const byK = await runByK();
        expect(byK.hb5[4]).toBe(-2); // window 1,2,7,4,7 → ties at -2 and 0
        expect(byK.hb5[27]).toBe(-1); // window 1,5,7,8,8 → ties at -1 and 0
        expect(byK.lb5[18]).toBe(-2); // window 9,8,2,5,2 → ties at -2 and 0
        expect(byK.lb5[19]).toBe(-3); // window 8,2,5,2,6 → ties at -3 and -1
        for (const name of ['hb5', 'lb5', 'hb3', 'lb3']) expect(byK[name], name).toEqual(TV[name]);
    });
});
