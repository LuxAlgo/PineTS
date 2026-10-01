// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * A custom provider whose getMarketData() throws or rejects must make run()
 * settle: the main series' error rejects run(); a request.security secondary's
 * error rejects run() too (TradingView stops a script whose requested symbol
 * can't be loaded), unless the call passes `ignore_invalid_symbol = true`, in
 * which case the requested series is na and the context records a warning.
 */

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';

const DAY = 86_400_000;
const START = Date.UTC(2024, 0, 1);

function dailyBars(n: number) {
    return Array.from({ length: n }, (_, i) => {
        const c = 100 + i;
        return { openTime: START + i * DAY, closeTime: START + (i + 1) * DAY - 1, open: c - 1, high: c + 1, low: c - 2, close: c, volume: 1000 };
    });
}

const symbolInfo = async (t: string) => ({ ticker: t, tickerid: t, prefix: '', root: t, description: t, type: 'stock', timezone: 'UTC', session: '24x7', currency: 'USD', mintick: 0.01, pricescale: 100, minmove: 1, pointvalue: 1 });

/** Fails the test instead of hanging it when `p` never settles. */
function settleWithin<T>(p: Promise<T>, ms = 3000): Promise<T> {
    return Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error('run() did not settle')), ms))]);
}

describe('provider errors', () => {
    it('run() rejects with the error a provider rejects with for the main series', async () => {
        const provider = {
            getMarketData: async () => {
                throw new Error('feed down');
            },
            getSymbolInfo: symbolInfo,
        };
        const pineTS = new PineTS(provider as any, 'AAA', 'D');
        await expect(settleWithin(pineTS.run('//@version=5\nindicator("x")\nplot(close)'))).rejects.toThrow('feed down');
    });

    it('run() rejects when getMarketData throws synchronously', async () => {
        const provider = {
            getMarketData: () => {
                throw new Error('sync boom');
            },
            getSymbolInfo: symbolInfo,
        };
        const pineTS = new PineTS(provider as any, 'AAA', 'D');
        await expect(settleWithin(pineTS.run('//@version=5\nindicator("x")\nplot(close)'))).rejects.toThrow('sync boom');
    });

    it('a request.security secondary whose data fails rejects run() with that error', async () => {
        const provider = {
            getMarketData: async (_t: string, tf: string) => {
                if (tf !== 'D') throw new Error('no weekly data');
                return dailyBars(40);
            },
            getSymbolInfo: symbolInfo,
        };
        const pineTS = new PineTS(provider as any, 'AAA', 'D');
        const code = `//@version=5
indicator("x")
plot(request.security(syminfo.tickerid, "W", close), "w")`;
        await expect(settleWithin(pineTS.run(code))).rejects.toThrow('no weekly data');
    });

    it('with ignore_invalid_symbol = true a failed secondary is na plus a warning', async () => {
        let weeklyCalls = 0;
        const provider = {
            getMarketData: async (_t: string, tf: string) => {
                if (tf !== 'D') {
                    weeklyCalls++;
                    throw new Error('no weekly data');
                }
                return dailyBars(40);
            },
            getSymbolInfo: symbolInfo,
        };
        const pineTS = new PineTS(provider as any, 'AAA', 'D');
        const code = `//@version=5
indicator("x")
plot(request.security(syminfo.tickerid, "W", close, ignore_invalid_symbol = true), "w")
plot(close, "c")`;
        const ctx = await settleWithin(pineTS.run(code));
        expect(ctx.plots['w'].data).toHaveLength(40);
        expect(ctx.plots['w'].data.every((d: any) => Number.isNaN(d.value))).toBe(true);
        expect(ctx.plots['c'].data[39].value).toBe(139);
        // One failed load, not one per bar, and one warning naming the request.
        expect(weeklyCalls).toBe(1);
        const warnings = ctx.warnings.filter((w) => w.method === 'request.security');
        expect(warnings).toHaveLength(1);
        expect(warnings[0].message).toContain('no weekly data');
    });

    it('a PineTS instance whose data never loads does not raise an unhandled rejection', async () => {
        const provider = {
            getMarketData: async () => {
                throw new Error('never awaited');
            },
            getSymbolInfo: symbolInfo,
        };
        const unhandled: unknown[] = [];
        const onUnhandled = (e: unknown) => unhandled.push(e);
        process.on('unhandledRejection', onUnhandled);
        try {
            new PineTS(provider as any, 'AAA', 'D');
            await new Promise((r) => setTimeout(r, 50));
        } finally {
            process.off('unhandledRejection', onUnhandled);
        }
        expect(unhandled).toHaveLength(0);
    });
});
