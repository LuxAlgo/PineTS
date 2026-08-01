// SPDX-License-Identifier: AGPL-3.0-only
//
// Streaming strategy-ledger rollback.
//
// On the live streaming path the forming (last) bar is re-executed on every
// tick, and re-executed once more with its final OHLC when the next bar
// arrives. Each re-execution must first restore the strategy ledger
// (pending_orders / opentrades / position / equity / peaks) to its
// pre-last-bar snapshot — otherwise every discarded execution leaks one
// pending order, and all leaked duplicates fill together on the next bar
// (position_size inflating by ticks+2 per bar instead of the scripted
// amount). Guarded by snapshotStrategyState/restoreStrategyState riding the
// _snapshotVarState/_restoreVarState cycle.
//
// Fully offline: a scripted fake IProvider replays a deterministic tick
// sequence (one provider poll == one tick).

import { describe, expect, it } from 'vitest';
import PineTS from 'PineTS.class';
import type { IProvider, ISymbolInfo } from '@pinets/marketData/IProvider';
import type { Kline } from '@pinets/marketData/types';

const MINUTE = 60_000;
const T0 = Date.UTC(2024, 0, 1, 0, 0, 0);

function candle(i: number, close: number): Kline {
    const open = 100;
    return {
        openTime: T0 + i * MINUTE,
        open,
        high: Math.max(open, close) + 1,
        low: Math.min(open, close) - 1,
        close,
        volume: 10,
        closeTime: T0 + (i + 1) * MINUTE - 1,
        quoteAssetVolume: 0,
        numberOfTrades: 0,
        takerBuyBaseAssetVolume: 0,
        takerBuyQuoteAssetVolume: 0,
        ignore: 0,
    };
}

type Step = { kind: 'tick'; close: number } | { kind: 'newbar'; close: number };

/**
 * First call (no sDate) returns the full history. Every later call advances
 * ONE scripted step — mutate the forming bar in place ('tick') or append a
 * new bar ('newbar') — then returns the bars from sDate on. `_updateMarketData`
 * polls once per streaming loop iteration, so one call == one tick.
 */
class ScriptedProvider implements IProvider {
    public bars: Kline[];
    public pollCount = 0;
    private steps: Step[];

    constructor(historyCloses: number[], steps: Step[]) {
        this.bars = historyCloses.map((c, i) => candle(i, c));
        this.steps = steps;
    }

    async getMarketData(_tickerId: string, _tf: string, _limit?: number, sDate?: number): Promise<Kline[]> {
        if (sDate === undefined) return this.bars.map((b) => ({ ...b }));

        const step = this.steps[this.pollCount];
        this.pollCount++;

        if (step) {
            if (step.kind === 'tick') {
                const last = this.bars[this.bars.length - 1];
                this.bars[this.bars.length - 1] = { ...last, close: step.close, high: Math.max(last.high, step.close) };
            } else {
                this.bars.push(candle(this.bars.length, step.close));
            }
        }

        return this.bars.filter((b) => b.openTime >= sDate).map((b) => ({ ...b }));
    }

    async getSymbolInfo(): Promise<ISymbolInfo> {
        return { mintick: 0.01, pointvalue: 1, currency: 'USD', timezone: 'UTC' } as unknown as ISymbolInfo;
    }

    configure(): void {}
}

/** T ticks on the forming bar, then one new closed bar. */
function tickSteps(ticks: number, tickBase: number, newBarClose: number): Step[] {
    return [
        ...Array.from({ length: ticks }, (_, i) => ({ kind: 'tick' as const, close: tickBase + i * 0.1 })),
        { kind: 'newbar' as const, close: newBarClose },
    ];
}

/**
 * Drive stream() until every scripted step has been consumed, collecting a
 * ledger snapshot per emitted page. An explicit pageSize is passed (and
 * ready() awaited) because stream() resolves `pageSize || this.data.length`
 * synchronously, before market data has loaded — without it pageSize is 0
 * and the generator spins on empty pages (known separate defect).
 */
async function runStream(provider: ScriptedProvider, stepCount: number, source: string) {
    const pine = new PineTS(provider as any, 'FAKE', '1');
    await pine.ready();
    const historyLen = provider.bars.length;

    const observed: any[] = [];
    let full: any = null;

    await new Promise<void>((resolve, reject) => {
        const s = pine.stream(source, { interval: 1, pageSize: historyLen });
        s.on('error', (e: any) => reject(e));
        s.on('data', (ctx: any) => {
            full = ctx.fullContext ?? ctx;
            if (!full?.strategy) return;
            observed.push({
                poll: provider.pollCount,
                bars: provider.bars.length,
                idx: full.idx,
                pending: full.strategy.pending_orders.length,
                opentrades: full.strategy.opentrades.length,
                closedtrades: full.strategy.closedtrades.length,
                position_size: full.strategy.position_size,
            });
            if (provider.pollCount > stepCount) {
                s.stop();
                resolve();
            }
        });
        setTimeout(() => {
            s.stop();
            resolve();
        }, 60_000);
    });

    return { observed, full };
}

const plotValues = (ctx: any, key: string) => ctx.plots[key].data.map((d: any) => d.value);

// One unconditional entry per evaluation, fixed qty 1 — every leaked
// re-execution would add a visible +1.
const ENTRY_EVERY_BAR = `
//@version=6
strategy('Entry every bar', overlay=false, pyramiding=100,
     default_qty_type=strategy.fixed, default_qty_value=1, initial_capital=1000000)

var int entries = 0
entries := entries + 1
strategy.entry("L", strategy.long, qty=1)

plotchar(strategy.position_size, "position_size")
plotchar(entries,                "entries")
`;

const HISTORY = [100, 101, 102, 103];

describe('Strategy - streaming ledger rollback', () => {
    // T=0 matters: even with no intra-bar ticks, the previously-forming bar
    // is re-executed once with its final OHLC when the next bar arrives —
    // without ledger rollback that alone double-books every bar.
    it.each([{ ticks: 0 }, { ticks: 1 }, { ticks: 4 }])(
        'streaming equals static with $ticks tick(s) on the forming bar',
        async ({ ticks }) => {
            const provider = new ScriptedProvider([...HISTORY], tickSteps(ticks, 103.1, 104));
            const { observed, full } = await runStream(provider, ticks + 1, ENTRY_EVERY_BAR);

            // Static control over the exact history the stream ended with.
            const staticPine = new PineTS(provider.bars.map((b) => ({ ...b })) as any, 'FAKE', '1');
            const staticCtx: any = await staticPine.run(ENTRY_EVERY_BAR);

            console.log(`[T=${ticks}] stream position_size:`, JSON.stringify(plotValues(full, 'position_size')));
            console.log(`[T=${ticks}] static position_size:`, JSON.stringify(plotValues(staticCtx, 'position_size')));
            console.log(`[T=${ticks}] per-poll ledger:`, JSON.stringify(observed));

            // The forming bar queues exactly ONE pending order, no matter how
            // many times it re-executes.
            const whileForming = observed.filter((o) => o.bars === HISTORY.length).map((o) => o.pending);
            expect(Math.max(...whileForming)).toBe(1);

            // Ledger parity with the static run at the end.
            const s = staticCtx.strategy;
            const f = full.strategy;
            expect(f.position_size).toBe(s.position_size);
            expect(f.opentrades.length).toBe(s.opentrades.length);
            expect(f.closedtrades.length).toBe(s.closedtrades.length);
            expect(f.netprofit).toBeCloseTo(s.netprofit, 10);
            expect(f.equity_peak).toBeCloseTo(s.equity_peak, 10);
            expect(f.max_drawdown).toBeCloseTo(s.max_drawdown, 10);
            expect(f.max_contracts_held_all).toBe(s.max_contracts_held_all);

            // var-Series rollback (the pre-existing mechanism) still intact:
            // the counter advances once per bar in the final series.
            const entries = plotValues(full, 'entries');
            expect(entries[entries.length - 1]).toBe(provider.bars.length);

            // Structural guards: market-data series match the provider and
            // bar_index is contiguous (no double-pops, no leaked pushes).
            expect(full.data.close.data.length).toBe(provider.bars.length);
            const barIdx = full.data.bar_index.data;
            expect(barIdx).toEqual(barIdx.map((_: any, i: number) => i));
        },
        90_000,
    );

    it('default pyramiding: an "enter when flat" breakout opens exactly one unit', async () => {
        // The breakout first triggers ON the forming bar, so the position is
        // flat during every re-execution — the pyramiding cap counts open
        // trades and cannot catch leaked duplicates. Only ledger rollback can.
        const script = `
//@version=6
strategy('Enter when flat', overlay=false,
     default_qty_type=strategy.fixed, default_qty_value=1, initial_capital=1000000)

if strategy.position_size == 0 and close > 103
    strategy.entry("L", strategy.long, qty=1)

plotchar(strategy.position_size, "position_size")
`;
        const provider = new ScriptedProvider([100, 101, 102, 102.5], tickSteps(4, 103.1, 104));
        const { observed, full } = await runStream(provider, 5, script);

        console.log('[flat-guard] per-poll ledger:', JSON.stringify(observed));

        expect(Math.max(...observed.map((o) => o.position_size))).toBe(1);
        expect(full.strategy.opentrades.length).toBe(1);
    }, 90_000);

    it('exit brackets queued on the forming bar do not fire or duplicate across ticks', async () => {
        // Entry fills on bar 3's open; a TP exit is (re-)queued on bar 3 whose
        // trigger the bar's own high crosses. It must not fill until bar 4,
        // and exactly once — a leaked ledger would let each tick's discarded
        // execution keep a filled copy.
        const script = `
//@version=6
strategy('TP exit', overlay=false,
     default_qty_type=strategy.fixed, default_qty_value=1, initial_capital=1000000)

if bar_index == 2
    strategy.entry("L", strategy.long, qty=1)
if bar_index >= 3
    strategy.exit("X", from_entry="L", limit=101.0)

plotchar(strategy.position_size, "position_size")
`;
        const provider = new ScriptedProvider([...HISTORY], tickSteps(2, 103.1, 104));
        const { observed, full } = await runStream(provider, 3, script);

        const staticPine = new PineTS(provider.bars.map((b) => ({ ...b })) as any, 'FAKE', '1');
        const staticCtx: any = await staticPine.run(script);

        console.log('[tp-exit] per-poll ledger:', JSON.stringify(observed));
        console.log('[tp-exit] static closedtrades:', staticCtx.strategy.closedtrades.length);

        // No close happens while bar 3 is still forming.
        const whileForming = observed.filter((o) => o.bars === HISTORY.length);
        expect(Math.max(...whileForming.map((o) => o.closedtrades))).toBe(0);

        // Full parity with the static run once bar 4 arrived.
        expect(full.strategy.closedtrades.length).toBe(staticCtx.strategy.closedtrades.length);
        expect(full.strategy.position_size).toBe(staticCtx.strategy.position_size);
        expect(full.strategy.netprofit).toBeCloseTo(staticCtx.strategy.netprofit, 10);
    }, 90_000);
});
