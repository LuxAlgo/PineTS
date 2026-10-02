// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Context } from '../../src/Context.class';

// Original synthetic fixture: close advances by one, so a three-bar SMA is
// exactly the middle close. No provider or downloaded market data is used.
function candles(count = 7) {
    return Array.from({ length: count }, (_, i) => ({
        openTime: Date.UTC(2024, 0, 1) + i * 60_000,
        closeTime: Date.UTC(2024, 0, 1) + (i + 1) * 60_000 - 1,
        open: 100 + i, high: 102 + i, low: 99 + i, close: 100 + i, volume: 10,
    }));
}

const indicator = ($) => {
    const { close } = $.data;
    const { ta, plot } = $.pine;
    const sma = ta.sma(close, 3);
    plot(sma, 'sma');
    return { close, sma };
};

describe('page projection', () => {
    it('keeps default Context pages and their sliced results', async () => {
        const runtime = new PineTS(candles());
        const pages: Context[] = [];
        for await (const page of runtime.run(indicator, undefined, 3)) pages.push(page);
        expect(pages.every(page => page instanceof Context)).toBe(true);
        expect(pages.map(page => page.result.close)).toEqual([[100, 101, 102], [103, 104, 105], [106]]);
        expect(pages[0].fullContext).toBe(pages[2].fullContext);
        expect(pages[2].fullContext.result.sma).toEqual([NaN, NaN, 101, 102, 103, 104, 105]);
    });

    it.each([1, 3, 20])('projects at the same completed-page boundaries (size %i)', async pageSize => {
        const runtime = new PineTS(candles());
        const facade = vi.spyOn(runtime as any, '_createPageContext');
        const calls: { context: Context; offset: number; idx: number }[] = [];
        const outputs: number[][] = [];
        const iterator = runtime.run(indicator, undefined, pageSize, {
            pageProjection: (context, offset) => {
                calls.push({ context, offset, idx: context.idx });
                return context.result.close.slice(offset) as number[];
            },
        });
        for await (const page of iterator) outputs.push(page!);
        expect(outputs.flat()).toEqual([100, 101, 102, 103, 104, 105, 106]);
        const ends = Array.from({ length: Math.ceil(7 / pageSize) }, (_, i) => Math.min((i + 1) * pageSize, 7));
        expect(calls.map(call => call.idx)).toEqual(ends.map(end => end - 1));
        expect(calls.map(call => call.offset)).toEqual(ends.map((_, i) => i * pageSize));
        expect(calls.every(call => call.context === calls[0].context)).toBe(true);
        expect(calls[0].context.result.sma).toEqual([NaN, NaN, 101, 102, 103, 104, 105]);
        expect(facade).not.toHaveBeenCalled();
        const complete = await new PineTS(candles()).run(indicator);
        expect(calls[0].context.result).toEqual(complete.result);
        expect(calls[0].context.plots).toEqual(complete.plots);
    });

    it('retains periods and stops processing when the consumer closes the iterator', async () => {
        const runtime = new PineTS(candles());
        const project = vi.fn((context: Context) => context);
        const iterator = runtime.run(indicator, 4, 1, { pageProjection: project });
        const first = await iterator.next();
        expect(first.value?.idx).toBe(3);
        expect(first.value?.result.close).toEqual([103]);
        await iterator.return(undefined);
        expect(project).toHaveBeenCalledTimes(1);
        expect(first.value?.result.close).toEqual([103]);
    });

    it('rejects through the iterator if projection fails', async () => {
        const error = new Error('consumer projection failed');
        const iterator = new PineTS(candles()).run(indicator, undefined, 1, {
            pageProjection: () => { throw error; },
        });
        await expect(iterator.next()).rejects.toBe(error);
        expect((await iterator.next()).done).toBe(true);
    });

    it('awaits asynchronous projections and propagates their rejections', async () => {
        const iterator = new PineTS(candles(1)).run(indicator, undefined, 1, {
            pageProjection: async context => context.idx,
        });
        expect((await iterator.next()).value).toBe(0);
        expect((await iterator.next()).done).toBe(true);
        const error = new Error('async projection failed');
        const failed = new PineTS(candles(1)).run(indicator, undefined, 1, {
            pageProjection: async () => { throw error; },
        });
        await expect(failed.next()).rejects.toBe(error);
    });

    it.each([0, -1, 1.5, Infinity])('rejects invalid projection page size %s', pageSize => {
        const runtime = new PineTS(candles());
        expect(() => runtime.run(indicator, undefined, pageSize, { pageProjection: context => context })).toThrow(RangeError);
    });

    it('preserves strategy state and finalization at every bar', async () => {
        const source = `//@version=6
strategy("Synthetic projection", default_qty_type=strategy.fixed, default_qty_value=1)
if bar_index == 0
    strategy.entry("entry", strategy.long)
if bar_index == 4
    strategy.close("entry")
plot(close, "close")
`;
        async function collect(projected: boolean) {
            const runtime = new PineTS(candles());
            const states: unknown[] = [];
            const iterator = projected
                ? runtime.run(source, undefined, 1, { pageProjection: context => ({ fullContext: context }) })
                : runtime.run(source, undefined, 1);
            for await (const page of iterator) {
                const context = page!.fullContext;
                states.push(structuredClone({ idx: context.idx, result: context.result, plots: context.plots, strategy: (context as any).strategy }));
            }
            return states;
        }
        const reference = await collect(false);
        expect(reference).toHaveLength(7);
        expect((reference[6] as any).strategy.closedtrades).toHaveLength(1);
        expect(await collect(true)).toEqual(reference);
    });

    it('preserves live rollback and null signals without projecting idle polls', async () => {
        const bars = candles(6);
        let fetches = 0;
        const provider = {
            async getMarketData() {
                return fetches++ === 0 ? bars.slice(0, 4) : fetches === 2 ? bars.slice(3) : [];
            },
        };
        const project = vi.fn((context: Context, offset: number) => context.result.close.slice(offset));
        const iterator = new PineTS(provider, 'SYNTHETIC', '1').run(indicator, undefined, 2, { pageProjection: project });
        expect((await iterator.next()).value).toEqual([100, 101]);
        expect((await iterator.next()).value).toEqual([102, 103]);
        expect((await iterator.next()).value).toEqual([103, 104]);
        expect((await iterator.next()).value).toEqual([105]);
        expect((await iterator.next()).value).toBeNull();
        expect(project).toHaveBeenCalledTimes(4);
        const context = project.mock.calls[0][0];
        expect(context.result.close).toEqual([100, 101, 102, 103, 104, 105]);
        expect(context.result.sma).toEqual([NaN, NaN, 101, 102, 103, 104]);
        await iterator.return(undefined);
    });
});
