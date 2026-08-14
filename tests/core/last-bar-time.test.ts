// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Regression: `last_bar_time` was implemented as
 * `data.openTime.get(data.openTime.length - 1)`. Since `Series.get` is
 * reverse-indexed (idx 0 = latest bar), `get(length - 1)` returned the
 * OLDEST bar's open time — the opposite of what the symbol means.
 *
 * Symptom in Smart-Money-Concepts (LuxAlgo)'s drawHighLowSwings:
 * `rightTimeBar = last_bar_time + 20 * (time - time[1])` extrapolated
 * 20 bars past the FIRST bar of the dataset instead of the last, so the
 * trailing Strong Low / Weak High lines were drawn from the historical
 * pivot back into the start of the dataset, not forward into the
 * future past the last bar.
 *
 * TV semantics: `last_bar_time` is the open time of the LAST bar of the
 * chart's history — a CONSTANT across the entire script execution, even
 * when iterating over historical bars. PineTS has the full preloaded
 * candle array on `context.marketData`, so it reads the absolute last
 * bar's openTime there.
 */

import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

// BTCUSDC weekly 2019-01-01 → 2019-02-01: 4 bars.
// Last bar openTime = 1548633600000 (2019-01-27 UTC).
const FIRST_BAR_TIME = 1546819200000;
const LAST_BAR_TIME = 1548633600000;

describe('last_bar_time (constant across the run)', () => {
    const makePineTS = () =>
        new PineTS(Provider.Mock, 'BTCUSDC', 'W', null,
            new Date('2019-01-01').getTime(),
            new Date('2019-02-01').getTime());

    it('returns the absolute last bar`s openTime, not the first', async () => {
        const { plots } = await makePineTS().run(`
//@version=5
indicator("lbt")
plot(last_bar_time, "lbt")
`);
        const data = plots['lbt'].data;
        expect(data.length).toBeGreaterThan(0);
        // Constant across every bar — including the first.
        for (const entry of data) {
            expect(entry.value).toBe(LAST_BAR_TIME);
        }
        // Defensive: must NOT be returning the first bar's time.
        expect(data[0].value).not.toBe(FIRST_BAR_TIME);
    });

    it('on the last bar, last_bar_time === time', async () => {
        const { plots } = await makePineTS().run(`
//@version=5
indicator("eq")
match = last_bar_time == time ? 1 : 0
plot(match, "match")
plot(time,  "t")
plot(last_bar_time, "lbt")
`);
        const matchData = plots['match'].data;
        const tData = plots['t'].data;
        const lbtData = plots['lbt'].data;

        // On the last bar (last entry), they should be equal.
        const last = matchData.length - 1;
        expect(matchData[last].value).toBe(1);
        expect(tData[last].value).toBe(LAST_BAR_TIME);
        expect(lbtData[last].value).toBe(LAST_BAR_TIME);

        // On earlier bars, time advances but last_bar_time is constant —
        // so they must NOT be equal.
        if (matchData.length > 1) {
            expect(matchData[0].value).toBe(0);
        }
    });

    it('rightTimeBar pattern (SMC-style projected future) lands past last_bar_time', async () => {
        const { plots } = await makePineTS().run(`
//@version=5
indicator("rtb")
rightTimeBar = last_bar_time + 20 * (time - time[1])
plot(rightTimeBar, "rtb")
`);
        const data = plots['rtb'].data;
        const lastEntry = data[data.length - 1];
        // 20 weekly bars past last_bar_time = 20 * 7 * 86400 * 1000 ms = 12_096_000_000.
        const expected = LAST_BAR_TIME + 20 * 7 * 86_400 * 1000;
        expect(lastEntry.value).toBe(expected);
        // Must be strictly in the future past the last bar.
        expect(lastEntry.value).toBeGreaterThan(LAST_BAR_TIME);
    });
});
