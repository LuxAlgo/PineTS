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
 *  - ta.cmo / ta.mfi: the change from the previous call, summed over the calls.
 * Not covered (TradingView's values follow none of these rules): ta.linreg and ta.rci in a local block,
 * and ta.highest / ta.lowest / ta.highestbars / ta.lowestbars under irregular gaps (PineTS uses the
 * calls of the last `length` bars, which TradingView matches when a bar in three is skipped).
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
