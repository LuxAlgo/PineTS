// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * request.* functions PineTS has no data source for used to be missing
 * entirely, so a script calling one stopped with
 * `request.financial is not a function`. They now return na and record one
 * warning per function in `ctx.warnings`, so the rest of the script runs.
 */

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';

const DAY = 86_400_000;
const START = Date.UTC(2024, 0, 1);
const BARS = 5;
const candles = Array.from({ length: BARS }, (_, i) => ({
    openTime: START + i * DAY, closeTime: START + (i + 1) * DAY - 1, open: 1, high: 2, low: 0, close: 1 + i, volume: 1,
}));

const STUBS = ['financial', 'economic', 'dividends', 'earnings', 'splits', 'quandl', 'currency_rate', 'seed'];

describe('unsupported request.* functions', () => {
    it('return na with one warning each, and the script keeps running', async () => {
        const ctx = await new PineTS(candles as any, 'AAA', 'D').run(`//@version=5
indicator("stubs")
plot(request.financial("AAA", "TOTAL_REVENUE", "FQ"), "financial")
plot(request.economic("US", "GDP"), "economic")
plot(request.dividends("AAA", dividends.gross), "dividends")
plot(request.earnings("AAA", earnings.actual), "earnings")
plot(request.splits("AAA", splits.denominator), "splits")
plot(request.quandl("CFTC/SB_FO_ALL", barmerge.gaps_off, 0), "quandl")
plot(request.currency_rate("EUR", "USD"), "currency_rate")
plot(request.seed("seed_crypto_santiment", "BTC_SENTIMENT_POSITIVE_TOTAL", close), "seed")
plot(close, "close")`);
        for (const name of STUBS) {
            expect(ctx.plots[name].data).toHaveLength(BARS);
            expect(ctx.plots[name].data.every((d: any) => Number.isNaN(d.value))).toBe(true);
        }
        expect(ctx.plots['close'].data[BARS - 1].value).toBe(BARS);
        const methods = ctx.warnings.map((w) => w.method);
        expect(methods.sort()).toEqual(STUBS.map((n) => `request.${n}`).sort());
        expect(ctx.warnings.find((w) => w.method === 'request.financial')!.message).toMatch(/not supported.*na/);
    });

    it('currency_rate of a currency to itself is 1', async () => {
        const ctx = await new PineTS(candles as any, 'AAA', 'D').run(`//@version=5
indicator("rate")
plot(request.currency_rate("USD", "USD"), "same")`);
        expect(ctx.plots['same'].data.every((d: any) => d.value === 1)).toBe(true);
        expect(ctx.warnings).toHaveLength(0);
    });
});
