// SPDX-License-Identifier: AGPL-3.0-only
// A candle without a close time — some providers omit it on the bar still forming, e.g. a weekly
// or monthly bar — gets `openTime + timeframe duration` on the initial load. Live updates
// (_replaceCandle / _appendCandle) stored the missing value as is, so after the first tick the
// forming bar had no close time: `time_close` became na, and request.security, which reads the
// close time to align a still-open higher-timeframe bar, returned na from then on.

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';

const MINUTE = 60_000;
const T0 = Date.UTC(2024, 0, 1);
// No closeTime on any candle.
const candle = (i: number, close = 100 + i) => ({ open: close, high: close + 1, low: close - 1, close, volume: 1, openTime: T0 + i * MINUTE });

function provider(count: number) {
    let served = count;
    let tick = 0;
    return {
        newBar: false,
        getMarketData: async function (_t: string, _tf: string, _limit?: number, sDate?: number) {
            if (sDate === undefined) return Array.from({ length: count }, (_, i) => candle(i));
            if (this.newBar) return [candle(served - 1), candle(served++)];
            return [candle(served - 1, 100 + served - 1 + ++tick * 0.5)];
        },
        getSymbolInfo: async () => null,
    };
}

// The bar's duration from its close time, -1 when the close time is na.
const code = `//@version=6
indicator("t")
plot(na(time_close) ? -1 : time_close - time, "dur")
`;

const lastValue = (ctx: any) => ctx.plots['dur'].data[ctx.plots['dur'].data.length - 1].value;

describe('close time of a live candle that has none', () => {
    it('is openTime + timeframe duration after a same-bar tick, as on the initial load', async () => {
        const N = 5;
        const pine = new PineTS(provider(N) as any, 'TEST', '1');
        await pine.ready();
        const ctx = await pine.run(code);
        expect(lastValue(ctx)).toBe(MINUTE);

        for (let tick = 1; tick <= 2; tick++) {
            expect(await pine.updateTail(ctx)).toBe(true);
            expect(lastValue(ctx)).toBe(MINUTE);
        }
    });

    it('is openTime + timeframe duration on a new bar', async () => {
        const N = 5;
        const source = provider(N);
        const pine = new PineTS(source as any, 'TEST', '1');
        await pine.ready();
        const ctx = await pine.run(code);

        source.newBar = true;
        expect(await pine.updateTail(ctx)).toBe(true);
        expect(lastValue(ctx)).toBe(MINUTE);
        expect(ctx.data.closeTime.get(0)).toBe(T0 + (N + 1) * MINUTE);
    });
});
