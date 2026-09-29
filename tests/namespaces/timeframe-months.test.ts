// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * In Pine an upper-case `M` unit is months: "M" / "1M" is one month, "3M" a
 * quarter, "12M" a year. The request normalizer lower-cased "3M" into its
 * minute alias "3m" → 3 minutes; timeframe.* read "3M" the same way; and
 * time() / timeframe.change() upper-cased everything, so "3m" / "1m" became
 * months. Lower-case "3m" isn't Pine syntax, but PineTS accepts it as a
 * minute alias and it must never mean months.
 */

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { normalizeTimeframe, TIMEFRAMES } from '../../src/namespaces/request/utils/TIMEFRAMES';
import { normalizeTimeframe as normalizeTimeTimeframe } from '../../src/namespaces/Time';

const DAY = 86_400_000;

function dailyBars(from: number, to: number) {
    const out: any[] = [];
    for (let t = from, i = 0; t < to; t += DAY, i++) {
        out.push({ openTime: t, closeTime: t + DAY - 1, open: i, high: i + 1, low: i - 1, close: i, volume: 1 });
    }
    return out;
}

const symbolInfo = async (t: string) => ({ ticker: t, tickerid: t, prefix: '', root: t, description: t, type: 'stock', timezone: 'UTC', session: '24x7', currency: 'USD', mintick: 0.01, pricescale: 100, minmove: 1, pointvalue: 1 });

describe('request normalizeTimeframe: M is months, m is minutes', () => {
    it('keeps multi-month timeframes as months', () => {
        expect(normalizeTimeframe('M')).toBe('M');
        expect(normalizeTimeframe('1M')).toBe('M');
        expect(normalizeTimeframe('3M')).toBe('3M');
        expect(normalizeTimeframe('12M')).toBe('12M');
    });

    it('keeps lower-case m a minute alias', () => {
        expect(normalizeTimeframe('3m')).toBe('3');
        expect(normalizeTimeframe('1m')).toBe('1');
    });

    it('orders multi-month timeframes after M', () => {
        const m = TIMEFRAMES.indexOf('M');
        expect(TIMEFRAMES.indexOf('3M')).toBeGreaterThan(m);
        expect(TIMEFRAMES.indexOf('12M')).toBeGreaterThan(TIMEFRAMES.indexOf('3M'));
    });
});

describe('Time normalizeTimeframe (time(), timeframe.change())', () => {
    it('keeps M months and m minutes', () => {
        expect(normalizeTimeTimeframe('M')).toBe('M');
        expect(normalizeTimeTimeframe('1M')).toBe('M');
        expect(normalizeTimeTimeframe('3M')).toBe('3M');
        expect(normalizeTimeTimeframe('3m')).toBe('3');
        expect(normalizeTimeTimeframe('1m')).toBe('1');
        expect(normalizeTimeTimeframe('1D')).toBe('D');
    });
});

describe('multi-month timeframes at runtime', () => {
    const from = Date.UTC(2024, 0, 1);
    const to = Date.UTC(2024, 6, 1);

    it('request.security(…, "3M", …) is a higher timeframe on a daily chart', async () => {
        const asked: string[] = [];
        const quarters = [
            { openTime: Date.UTC(2024, 0, 1), closeTime: Date.UTC(2024, 3, 1) - 1, open: 1, high: 1, low: 1, close: 111, volume: 1 },
            { openTime: Date.UTC(2024, 3, 1), closeTime: Date.UTC(2024, 6, 1) - 1, open: 2, high: 2, low: 2, close: 222, volume: 1 },
        ];
        const provider = {
            getMarketData: async (_t: string, tf: string) => {
                asked.push(tf);
                return tf === '3M' ? quarters : dailyBars(from, to);
            },
            getSymbolInfo: symbolInfo,
        };
        const ctx = await new PineTS(provider as any, 'AAA', 'D').run(`//@version=5
indicator("q")
plot(request.security(syminfo.tickerid, "3M", close, lookahead = barmerge.lookahead_on), "q")`);
        expect(asked).toContain('3M');
        const at = (y: number, m: number, d: number) => ctx.plots['q'].data.find((p: any) => p.time === Date.UTC(y, m, d)).value;
        expect(at(2024, 1, 15)).toBe(111);
        expect(at(2024, 4, 15)).toBe(222);
    });

    it('timeframe.* on a 3M chart reports months', async () => {
        const quarters = dailyBars(from, to).filter((b) => new Date(b.openTime).getUTCDate() === 1 && new Date(b.openTime).getUTCMonth() % 3 === 0);
        const ctx = await new PineTS(quarters as any, 'AAA', '3M').run(`//@version=5
indicator("tf")
plot(timeframe.ismonthly ? 1 : 0, "monthly")
plot(timeframe.isminutes ? 1 : 0, "minutes")
plot(timeframe.multiplier, "mult")
plot(timeframe.in_seconds(), "secs")`);
        expect(ctx.plots['monthly'].data[0].value).toBe(1);
        expect(ctx.plots['minutes'].data[0].value).toBe(0);
        expect(ctx.plots['mult'].data[0].value).toBe(3);
        expect(ctx.plots['secs'].data[0].value).toBe(3 * 30 * 86400);
        expect(ctx.pine.timeframe.period).toBe('3M');
    });

    it('timeframe.change("3M") and time("3M") follow quarters on a daily chart', async () => {
        const ctx = await new PineTS(dailyBars(from, to) as any, 'AAA', 'D').run(`//@version=5
indicator("chg")
plot(timeframe.change("3M") ? 1 : 0, "chg")
plot(time("3M"), "t")`);
        const fired = ctx.plots['chg'].data.filter((d: any) => d.value === 1).map((d: any) => new Date(d.time).toISOString().slice(0, 10));
        expect(fired).toEqual(['2024-04-01']);
        const t = (y: number, m: number, d: number) => ctx.plots['t'].data.find((p: any) => p.time === Date.UTC(y, m, d)).value;
        expect(t(2024, 1, 15)).toBe(Date.UTC(2024, 0, 1));
        expect(t(2024, 5, 30)).toBe(Date.UTC(2024, 3, 1));
    });
});
