// SPDX-License-Identifier: AGPL-3.0-only

/**
 * ta functions called inside a local block (an `if` that does not run on every bar).
 *
 * TradingView values: `data/local-block-btcusdt.json` holds the 299 closed BINANCE:BTCUSDT 1h candles
 * TradingView computed on (its own OHLCV, so the volume-based functions match too) and its output on
 * the last 60 of them for four scripts: the calls under `hour % 3 != 0`
 * (one bar skipped in three), under `close > open` (irregular gaps), under `6 <= hour < 18` (12 bars
 * skipped in a row), and inside a function called from two places under different conditions. Every
 * window is shorter than the 239 bars before the checked ones, so these candles reproduce TradingView.
 *
 * What those values show, function by function:
 *  - the last `length` CALLS: ta.sma, ta.median, ta.stdev, ta.variance, ta.vwma, ta.range,
 *    ta.percentile_linear_interpolation, ta.percentile_nearest_rank, ta.mode, math.sum, ta.valuewhen;
 *  - the last `length` BARS, a bar on which the call did not run repeating the last call's value (the
 *    history of `source[i]` inside the function): ta.wma, ta.hma, ta.alma, ta.swma, ta.change,
 *    ta.mom, ta.roc, ta.percentrank, ta.stoch, ta.wpr, ta.pivothigh, ta.pivotlow;
 *  - both: ta.dev / ta.cci (mean over the calls, deviations over the bars), ta.cog (sum over the
 *    calls, weighted sum over the bars);
 *  - ta.cmo / ta.mfi: the change from the previous call, summed over the calls;
 *  - `length + 1` slots indexed by bar index, written by the calls, a skipped bar reading what its slot
 *    last held: ta.linreg, ta.rci, and ta.highest / ta.lowest / ta.highestbars / ta.lowestbars (which
 *    keep their extreme from call to call and rescan the slots when it is `length` bars old).
 * The ta.linreg under `hour % 3 != 0` is left out: its skipped slots hold values written long before
 * these candles (it matches when TradingView's history is replayed from its first bar).
 *
 * With a series length (it may change on every call), the same windows reach as far back as each
 * call's length: the last `length` calls, or the last `length` bars of that history. ta.linreg and
 * ta.highest / ta.lowest / *bars then read the history with skipped bars repeating the last call's
 * value instead of the slots (TradingView compiles them differently; PineTS switches at the first call
 * whose length changes). ta.percentile_* complete their array from that history when the length grows.
 * `data/varlen-btcusdt.json`: TradingView's values for 5 scripts calling every function that takes a
 * series length with 4 length patterns at the top level and 2 in a local block. Left out where TradingView's
 * own rounding shows (a variance of 0 computed as a difference of running sums of squares, at length 1
 * or after a jump from 150 to 3: ta.stdev, ta.variance, ta.cci, ta.bbw, ta.bb, ta.correlation).
 *
 * `data/tv-synthetic-sources.json` pins those rules down with sources that are functions of a bar count
 * k (distinct values, na patterns, strictly increasing), so each returned value names the bar it came
 * from: ta.highest / ta.lowest / *bars under several gap patterns and with na, the slots of ta.lowest,
 * ta.linreg / ta.rci in local blocks, and ta.percentile_* with na (PercentileArray). Checked from k = 20,
 * after the bars where PineTS backfills a first call from the source history.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { PineTS } from '../../../src/PineTS.class';

const fixture = JSON.parse(readFileSync(new URL('./data/local-block-btcusdt.json', import.meta.url), 'utf8'));
const isNa = (v: any) => v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v));

describe('ta functions in a local block (TradingView parity)', () => {
    for (const [name, probe] of Object.entries<any>(fixture.probes)) {
        it(`matches TradingView on BTCUSDT 1h: ${name}`, async () => {
            const { plots } = await new PineTS(fixture.candles).run(probe.script);
            const mismatches: string[] = [];
            for (const [plot, want] of Object.entries<(number | null)[]>(probe.tv)) {
                const got = plots[plot].data.slice(fixture.checkFrom).map((d: any) => d.value);
                want.forEach((w, i) => {
                    const g = got[i];
                    const ok = isNa(w) ? isNa(g) : !isNa(g) && Math.abs(g - w) <= 1e-6 * Math.max(1, Math.abs(w));
                    if (!ok && mismatches.length < 20) mismatches.push(`${plot} bar ${fixture.checkFrom + i}: TradingView ${w}, PineTS ${g}`);
                });
            }
            expect(mismatches).toEqual([]);
        });
    }
});

const varlen = JSON.parse(readFileSync(new URL('./data/varlen-btcusdt.json', import.meta.url), 'utf8'));

describe('ta functions with a series length (TradingView parity)', () => {
    for (const [name, probe] of Object.entries<any>(varlen.probes)) {
        it(`matches TradingView on BTCUSDT 1h: ${name}`, async () => {
            const { plots } = await new PineTS(varlen.candles).run(probe.script);
            const mismatches: string[] = [];
            for (const [plot, want] of Object.entries<(number | null)[]>(probe.tv)) {
                const got = plots[plot].data.slice(varlen.checkFrom).map((d: any) => d.value);
                want.forEach((w, i) => {
                    const g = got[i];
                    const ok = isNa(w) ? isNa(g) : !isNa(g) && Math.abs(g - w) <= 1e-6 * Math.max(1, Math.abs(w));
                    if (!ok && mismatches.length < 20) mismatches.push(`${plot} bar ${varlen.checkFrom + i}: TradingView ${w}, PineTS ${g}`);
                });
            }
            expect(mismatches).toEqual([]);
        });
    }
});

const synthetic = JSON.parse(readFileSync(new URL('./data/tv-synthetic-sources.json', import.meta.url), 'utf8'));

describe('ta functions on synthetic sources (TradingView parity)', () => {
    for (const [name, probe] of Object.entries<any>(synthetic.probes)) {
        it(`matches TradingView: ${name}`, async () => {
            const candles = probe.times.map((t: number) => ({
                openTime: t * 1000,
                open: 1,
                high: 1,
                low: 1,
                close: 1,
                volume: 1,
                closeTime: t * 1000 + 3599_999,
            }));
            const { plots } = await new PineTS(candles).run(probe.script);
            const mismatches: string[] = [];
            for (const [plot, want] of Object.entries<(number | null)[]>(probe.tv)) {
                const got = plots[plot].data.slice(probe.checkFrom).map((d: any) => d.value);
                want.forEach((w, i) => {
                    const g = got[i];
                    const ok = isNa(w) ? isNa(g) : !isNa(g) && Math.abs(g - w) <= 1e-9 * Math.max(1, Math.abs(w));
                    if (!ok && mismatches.length < 20) mismatches.push(`${plot} k=${synthetic.from + i}: TradingView ${w}, PineTS ${g}`);
                });
            }
            expect(mismatches).toEqual([]);
        });
    }
});
