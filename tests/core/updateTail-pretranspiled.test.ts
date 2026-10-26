// SPDX-License-Identifier: AGPL-3.0-only
// updateTail() on a context without a snapshot — one made by runPretranspiled(), which is how
// request.security runs its secondary contexts — rolled the last bar back twice: once in
// _removeLastResult and once more with the explicit pops that follow it. The re-executed bar
// then saw its history shifted by one bar. runPretranspiled() now snapshots before the last bar
// like run(), and the fallback (a single-bar run) no longer pops twice.

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { transpile } from '../../src/transpiler/index';

const MINUTE = 60_000;
const T0 = 1_700_000_000_000;
const candle = (i: number, close = 100 + i) => ({
    open: close - 1,
    high: close + 1,
    low: close - 2,
    close,
    volume: 1000,
    openTime: T0 + i * MINUTE,
    closeTime: T0 + (i + 1) * MINUTE - 1,
});

/** Serves `count` candles, then the last one again with each tick's close. */
function tickingProvider(count: number) {
    const candles = Array.from({ length: count }, (_, i) => candle(i));
    const last = candles[count - 1];
    let tick = 0;
    return {
        getMarketData: async (_t: string, _tf: string, _limit?: number, sDate?: number) => {
            if (sDate !== undefined && sDate >= last.openTime) return [candle(count - 1, last.close + ++tick * 0.5)];
            return candles;
        },
        getSymbolInfo: async () => null,
    };
}

const code = `//@version=6
indicator("t")
var int n = 0
n += 1
plot(n, "n")
plot(close, "c")
plot(close[1], "prev")
plot(bar_index, "bi")
`;

const last = (ctx: any, name: string) => ctx.plots[name].data[ctx.plots[name].data.length - 1].value;

describe('updateTail on a runPretranspiled() context', () => {
    it('runPretranspiled: a same-bar tick re-runs the last bar on the right history', async () => {
        const N = 10;
        const pine = new PineTS(tickingProvider(N) as any, 'TEST', '1');
        await pine.ready();
        const ctx = await pine.runPretranspiled(transpile(code));
        expect(last(ctx, 'n')).toBe(N);

        for (let tick = 1; tick <= 3; tick++) {
            expect(await pine.updateTail(ctx)).toBe(true);
            expect(ctx.data.close.data.length).toBe(N);
            expect(last(ctx, 'n')).toBe(N);
            expect(last(ctx, 'c')).toBe(100 + N - 1 + tick * 0.5);
            expect(last(ctx, 'prev')).toBe(100 + N - 2);
            expect(last(ctx, 'bi')).toBe(N - 1);
        }
    });

    it('runPretranspiled: a tick that opens a new bar keeps one entry per bar', async () => {
        const N = 10;
        const candles = Array.from({ length: N }, (_, i) => candle(i));
        let served = N;
        const provider = {
            getMarketData: async (_t: string, _tf: string, _limit?: number, sDate?: number) =>
                sDate !== undefined ? [candle(served - 1), candle(served++)] : candles,
            getSymbolInfo: async () => null,
        };
        const pine = new PineTS(provider as any, 'TEST', '1');
        await pine.ready();
        const ctx = await pine.runPretranspiled(transpile(code));

        for (let tick = 1; tick <= 3; tick++) {
            expect(await pine.updateTail(ctx)).toBe(true);
            expect(ctx.data.close.data.length).toBe(N + tick);
            expect(last(ctx, 'n')).toBe(N + tick);
            expect(last(ctx, 'prev')).toBe(100 + N + tick - 2);
            expect(last(ctx, 'bi')).toBe(N + tick - 1);
        }
    });
});
