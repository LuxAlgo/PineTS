// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * A PineTS built on an array of candles has no provider to ask for symbol
 * info or for other series. syminfo is a default built from the ticker
 * argument (so `syminfo.tickerid` no longer throws), and a request.security /
 * request.security_lower_tf that needs another series fails with a clear
 * error instead of `Cannot read properties of undefined (reading 'tickerid')`
 * — or, before that, silently re-using the chart's own candles.
 */

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';

const DAY = 86_400_000;
const START = Date.UTC(2024, 0, 1);
const candles = Array.from({ length: 30 }, (_, i) => ({
    openTime: START + i * DAY,
    closeTime: START + (i + 1) * DAY - 1,
    open: 100 + i,
    high: 102 + i,
    low: 99 + i,
    close: 101 + i,
    volume: 1000,
}));

describe('array data source', () => {
    it('gets a default syminfo built from the ticker argument', async () => {
        const pineTS = new PineTS(candles as any, 'AAA', 'D');
        const ctx = await pineTS.run(`//@version=5
indicator("x")
plot(syminfo.tickerid == "AAA" ? 1 : 0, "tickerid")
plot(syminfo.ticker == "AAA" ? 1 : 0, "ticker")
plot(syminfo.mintick, "mintick")
plot(math.round_to_mintick(close + 0.004), "rounded")`);
        expect(ctx.plots['tickerid'].data[0].value).toBe(1);
        expect(ctx.plots['ticker'].data[0].value).toBe(1);
        expect(ctx.plots['mintick'].data[0].value).toBe(0.01);
        expect(ctx.plots['rounded'].data[0].value).toBe(101);
        expect(ctx.pine.syminfo.timezone).toBe('UTC');
    });

    it('works without a ticker argument', async () => {
        const pineTS = new PineTS(candles as any);
        const ctx = await pineTS.run(`//@version=5
indicator("x")
plot(str.length(syminfo.tickerid), "len")`);
        expect(ctx.plots['len'].data[0].value).toBe(0);
    });

    it('request.security of the chart symbol and timeframe uses the candles', async () => {
        const pineTS = new PineTS(candles as any, 'AAA', 'D');
        const ctx = await pineTS.run(`//@version=5
indicator("x")
plot(request.security(syminfo.tickerid, "D", close), "same")`);
        expect(ctx.plots['same'].data.map((d: any) => d.value)).toEqual(candles.map((c) => c.close));
    });

    it('request.security of another timeframe fails with a clear error', async () => {
        const pineTS = new PineTS(candles as any, 'AAA', 'D');
        await expect(
            pineTS.run(`//@version=5
indicator("x")
plot(request.security(syminfo.tickerid, "W", close))`),
        ).rejects.toThrow(/request\.security needs a market data provider/);
    });

    it('request.security of another symbol fails with a clear error', async () => {
        const pineTS = new PineTS(candles as any, 'AAA', 'D');
        await expect(
            pineTS.run(`//@version=5
indicator("x")
plot(request.security("BBB", "D", close))`),
        ).rejects.toThrow(/request\.security needs a market data provider/);
    });

    it('request.security_lower_tf of a lower timeframe fails with a clear error', async () => {
        const pineTS = new PineTS(candles as any, 'AAA', 'D');
        await expect(
            pineTS.run(`//@version=5
indicator("x")
plot(array.size(request.security_lower_tf(syminfo.tickerid, "60", close)))`),
        ).rejects.toThrow(/request\.security_lower_tf needs a market data provider/);
    });
});
