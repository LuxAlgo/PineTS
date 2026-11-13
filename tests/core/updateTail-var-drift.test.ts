import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeCandle(i: number, baseTime = 1_700_000_000_000) {
    const close = 100 + i;
    return {
        open: close - 1,
        high: close + 1,
        low: close - 2,
        close,
        volume: 1000,
        openTime: baseTime + i * 60_000,
        closeTime: baseTime + i * 60_000 + 59_999,
    };
}

/**
 * Minimal IProvider mock.
 * - Returns `initialCandles` on the initial load (sDate before last candle).
 * - Returns `updatedLast` when _updateMarketData calls with sDate === last candle's openTime.
 */
function makeMockProvider(initialCandles: any[], updatedLast: any) {
    const lastOpenTime = initialCandles[initialCandles.length - 1].openTime;
    return {
        getMarketData: async (_ticker: string, _tf: string, _limit?: number, sDate?: number) => {
            // _updateMarketData passes sDate = last candle's openTime
            if (sDate !== undefined && sDate >= lastOpenTime) {
                return [updatedLast];
            }
            return initialCandles;
        },
        getSymbolInfo: async () => null,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('updateTail: var state drift fix', () => {
    /**
     * Regression test for the pop-based rollback bug in updateTail().
     *
     * A `var` accumulator increments once per bar. After run(), its value
     * on the last bar equals N (the bar count). When updateTail() re-executes
     * the same last bar (same-bar tick update), the accumulator must remain N.
     *
     * With the old _removeLastResult approach the Series pop did not restore
     * the in-place mutated last value, so re-execution incremented to N+1.
     * The snapshot-restore approach fixes this.
     */
    it('var accumulator stays stable after a same-bar tick update', async () => {
        const N = 10;
        const candles = Array.from({ length: N }, (_, i) => makeCandle(i));
        // Same openTime as last candle — simulates a forming-bar price update
        const updatedLast = { ...candles[N - 1], close: candles[N - 1].close + 0.5 };

        const provider = makeMockProvider(candles, updatedLast);
        const pine = new PineTS(provider as any, 'TEST', '1');
        await pine.ready();

        // PineTS JS syntax: var declaration is transpiled to $.var persistence.
        // This is the exact pattern that drifts under the pop-based approach:
        //   var n = 0  →  $.var.glb1_n = $.initVar($.var.glb1_n, 0)
        //   n = n + 1  →  $.set($.var.glb1_n, $.get($.var.glb1_n, 0) + 1)
        const ctx = await pine.run(($: any) => {
            const { plot } = $.pine;
            var n = 0;
            n = n + 1;
            plot(n, 'n');
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        const nAfterRun = ctx.plots['n'].data[ctx.plots['n'].data.length - 1].value;
        // Sanity check: after N bars, accumulator must equal N
        expect(nAfterRun).toBe(N);

        // Simulate one live tick (same bar, updated close)
        const updated = await pine.updateTail(ctx);
        expect(updated).toBe(true);

        const nAfterTick = ctx.plots['n'].data[ctx.plots['n'].data.length - 1].value;
        // Must remain N — NOT N+1 (which is the pre-fix drift value)
        expect(nAfterTick).toBe(N);
    });

    /**
     * Verifies that drift does not accumulate across multiple consecutive
     * same-bar updateTail() calls (e.g. a candle forming over several ticks).
     *
     * Each tick re-executes the same last bar. The accumulator must remain N
     * on every tick, never increasing.
     */
    it('no drift across 3 consecutive same-bar updateTail calls', async () => {
        const N = 5;
        const candles = Array.from({ length: N }, (_, i) => makeCandle(i));

        let tickCount = 0;
        const provider = {
            getMarketData: async (_ticker: string, _tf: string, _limit?: number, sDate?: number) => {
                const lastOpenTime = candles[N - 1].openTime;
                if (sDate !== undefined && sDate >= lastOpenTime) {
                    tickCount++;
                    // Each tick returns the same bar with a slightly updated close
                    return [{ ...candles[N - 1], close: candles[N - 1].close + tickCount * 0.1 }];
                }
                return candles;
            },
            getSymbolInfo: async () => null,
        };

        const pine = new PineTS(provider as any, 'TEST', '1');
        await pine.ready();

        const ctx = await pine.run(($: any) => {
            const { plot } = $.pine;
            var n = 0;
            n = n + 1;
            plot(n, 'n');
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        const initialN = ctx.plots['n'].data[ctx.plots['n'].data.length - 1].value;
        expect(initialN).toBe(N);

        // Run 3 ticks — each should hold n === N, never drift to N+1, N+2, N+3
        for (let tick = 1; tick <= 3; tick++) {
            const updated = await pine.updateTail(ctx);
            expect(updated).toBe(true);

            const n = ctx.plots['n'].data[ctx.plots['n'].data.length - 1].value;
            expect(n).toBe(N);
        }
    });
});