import { describe, expect, it } from 'vitest';
import { PineRuntimeError } from '../../../src/errors/PineRuntimeError';
import { ExecutionBudget } from '../../../src/security/ExecutionBudget';
import { alma } from '../../../src/namespaces/ta/methods/alma';
import { rci } from '../../../src/namespaces/ta/methods/rci';
import { sma } from '../../../src/namespaces/ta/methods/sma';
import { TechnicalAnalysis } from '../../../src/namespaces/ta/ta.index';
import { MAX_TA_LENGTH } from '../../../src/namespaces/ta/utils/assertTaLength';
import { crossPair } from '../../../src/namespaces/ta/utils/naAware';
import { Series } from '../../../src/Series';

const context = (executionBudget = new ExecutionBudget()): any => ({
    idx: 0,
    taState: Object.create(null),
    executionBudget,
    precision: (value: number) => value,
});

describe('ta length resource policy', () => {
    const lengthCalls: Array<[string, (length: number) => any[]]> = [
        ['alma', n => [1, n, 0.85, 6]], ['atr', n => [n]], ['bb', n => [1, n, 2]],
        ['bbw', n => [1, n, 2]], ['cci', n => [1, n]], ['change', n => [1, n]],
        ['cmo', n => [1, n]], ['cog', n => [1, n]], ['correlation', n => [1, 2, n]],
        ['dev', n => [1, n]], ['dmi', n => [n, 2]], ['dmi', n => [2, n]],
        ['ema', n => [1, n]], ['falling', n => [1, n]], ['highest', n => [1, n]],
        ['highest', n => [n, '_callId']], ['highestbars', n => [1, n]],
        ['highestbars', n => [n, '_callId']], ['hma', n => [1, n]],
        ['kc', n => [1, n, 2]], ['kcw', n => [1, n, 2]], ['linreg', n => [1, n, 0]],
        ['lowest', n => [1, n]], ['lowest', n => [n, '_callId']],
        ['lowestbars', n => [1, n]], ['lowestbars', n => [n, '_callId']],
        ['macd', n => [1, n, 26, 9]], ['macd', n => [1, 12, n, 9]],
        ['macd', n => [1, 12, 26, n]], ['median', n => [1, n]],
        ['mfi', n => [1, n]], ['mode', n => [1, n]], ['mom', n => [1, n]],
        ['percentile_linear_interpolation', n => [1, n, 50]],
        ['percentile_nearest_rank', n => [1, n, 50]], ['percentrank', n => [1, n]],
        ['pivothigh', n => [1, n, 2]], ['pivothigh', n => [1, 2, n]],
        ['pivotlow', n => [1, n, 2]], ['pivotlow', n => [1, 2, n]],
        ['range', n => [1, n]], ['rci', n => [1, n]], ['rising', n => [1, n]],
        ['rma', n => [1, n]], ['roc', n => [1, n]], ['rsi', n => [1, n]],
        ['sma', n => [1, n]], ['stdev', n => [1, n]], ['stoch', n => [1, 2, 0, n]],
        ['supertrend', n => [3, n]], ['tsi', n => [1, n, 25]],
        ['tsi', n => [1, 13, n]], ['variance', n => [1, n]],
        ['vwma', n => [1, n]], ['wma', n => [1, n]], ['wpr', n => [n]],
    ];

    it.each([NaN, Infinity, -Infinity, -1, 0.5, Number.MAX_SAFE_INTEGER + 1, MAX_TA_LENGTH + 1])(
        'rejects unsafe length %s at every public TA method entry', length => {
            for (const [name, args] of lengthCalls) {
                // Pivot strengths are truncated before validation, unlike TA window lengths.
                if (length === 0.5 && (name === 'pivothigh' || name === 'pivotlow')) continue;
                const ctx = context();
                const ta = new TechnicalAnalysis(ctx);
                ctx.pine = { ta };
                expect(() => (ta as any)[name](...args(length)), name).toThrow(PineRuntimeError);
                expect(Object.keys(ctx.taState), name).toHaveLength(0);
            }
        }
    );

    it('preserves zero-offset forms and rejects a pivot whose combined span exceeds the cap', () => {
        const ctx = context();
        const ta = new TechnicalAnalysis(ctx);
        ctx.pine = { ta };
        expect(() => ta.change(1, 0)).not.toThrow();
        expect(() => ta.roc(1, 0)).not.toThrow();
        expect(() => ta.pivothigh(1, 0, 0)).not.toThrow();
        expect(() => ta.pivotlow(1, 0, 0)).not.toThrow();
        expect(() => ta.pivothigh(1, 2.9, 1.2)).not.toThrow();
        expect(() => ta.pivotlow(1, 2.9, 1.2)).not.toThrow();
        expect(() => ta.pivothigh(1, 2_500, 2_500)).toThrow(PineRuntimeError);
        expect(() => ta.pivothigh(1, 2_500.9, 2_500.9)).toThrow(PineRuntimeError);
        expect(() => ta.pivotlow(1, 2_500.9, 2_500.9)).toThrow(PineRuntimeError);
        expect(Number.isNaN(ta.hma(1, 1))).toBe(true);
    });

    it.each([
        ['alma', (ctx: any, length: number) => alma(ctx)(1, length, 0.85, 6)],
        ['rci', (ctx: any, length: number) => rci(ctx)(1, length)],
        ['sma', (ctx: any, length: number) => sma(ctx)(1, length)],
    ] as const)('%s rejects an excessive length before keeping state', (_name, run) => {
        const ctx = context();
        expect(() => run(ctx, 5_001)).toThrow(PineRuntimeError);
        expect(Object.keys(ctx.taState)).toHaveLength(0);
    });

    it('accepts the documented maximum at representative allocation boundaries', () => {
        expect(() => alma(context())(1, MAX_TA_LENGTH, 0.85, 6)).not.toThrow();
        expect(() => rci(context())(1, MAX_TA_LENGTH)).not.toThrow();
        expect(() => sma(context())(1, MAX_TA_LENGTH)).not.toThrow();
    });

    it('charges repeated changes of ALMA length against the run-wide budget', () => {
        const ctx = context(new ExecutionBudget(500_000, { maxWorkUnits: 30, maxMemoryBytes: 64 * 1024 * 1024 }));
        const call = alma(ctx);
        expect(() => call(1, 5, 0.85, 6, 'length-series')).not.toThrow();
        expect(() => call(1, 6, 0.85, 6, 'length-series')).not.toThrow();
        expect(() => call(1, 7, 0.85, 6, 'length-series')).toThrow(PineRuntimeError);
    });

    it('charges keyless scans even when a small length meets a long run of na bars', () => {
        const source = new Array(1_001).fill(NaN);
        for (const name of ['highestbars', 'lowestbars', 'rising', 'falling'] as const) {
            const ctx = context(new ExecutionBudget(500_000, { maxWorkUnits: 10 }));
            ctx.idx = 1_000;
            const ta = new TechnicalAnalysis(ctx);
            expect(() => ta[name](source, 1)).toThrow(PineRuntimeError);
        }

        source[1_000] = 1;
        const ctx = context(new ExecutionBudget(500_000, { maxWorkUnits: 10 }));
        ctx.idx = 1_000;
        const ta = new TechnicalAnalysis(ctx);
        expect(() => ta.pivothigh(source, 1, 0)).toThrow(PineRuntimeError);
    });

    it('charges completed-window scans, sorted-window construction, and percentile inserts', () => {
        const source = Array.from({ length: 201 }, (_, i) => 201 - i);
        // A late first call no longer backfills source history. Feed real calls until the
        // 100-value window is complete, then assert its native scan/construction is charged.
        const expectCompletedWindowCharge = (limit: number, call: (ta: TechnicalAnalysis, values: number[]) => unknown) => {
            const ctx = context(new ExecutionBudget(500_000, { maxWorkUnits: limit }));
            const ta = new TechnicalAnalysis(ctx);
            for (let idx = 0; idx < 99; idx++) {
                ctx.idx = idx;
                call(ta, source.slice(0, idx + 1));
            }
            ctx.idx = 99;
            expect(() => call(ta, source.slice(0, 100))).toThrow(PineRuntimeError);
        };

        expectCompletedWindowCharge(150, (ta, values) => ta.bb(values, 100, 2));
        expectCompletedWindowCharge(2_000, (ta, values) => ta.median(values, 100));

        // Descending values shift an ever larger sorted array on successive calls.
        const ctx = context(new ExecutionBudget(500_000, { maxWorkUnits: 1_000 }));
        const ta = new TechnicalAnalysis(ctx);
        expect(() => {
            for (let idx = 0; idx < 100; idx++) {
                ctx.idx = idx;
                ta.percentile_linear_interpolation(source.slice(0, idx + 1), 100, 50);
            }
        }).toThrow(PineRuntimeError);
    });

    it('charges a repeated same-bar sorted-window rollback', () => {
        const source = Array.from({ length: 101 }, (_, i) => 101 - i);
        const ctx = context(new ExecutionBudget(500_000, { maxWorkUnits: 10_000 }));
        const ta = new TechnicalAnalysis(ctx);
        for (let idx = 0; idx < 50; idx++) {
            ctx.idx = idx;
            ta.median(source.slice(0, idx + 1), 50, 'same-bar');
        }
        const first = ctx.executionBudget.workUnits;
        ta.median(source.slice(0, 50), 50, 'same-bar');
        expect(ctx.executionBudget.workUnits).toBeGreaterThan(first);
    });

    it('does not charge nonexistent source backfill on a late first percentile call', () => {
        const ctx = context(new ExecutionBudget(500_000, { maxWorkUnits: 50 }));
        ctx.idx = 200;
        const ta = new TechnicalAnalysis(ctx);
        const source = Array.from({ length: 201 }, (_, i) => 201 - i);

        expect(() => ta.percentile_linear_interpolation(source, 100, 50)).not.toThrow();
        expect(() => ta.percentile_linear_interpolation(source, 100, 50)).not.toThrow();
        expect(ctx.executionBudget.workUnits).toBeGreaterThan(0);
    });

    it('rejects percentile work before mutating its history or sorted values', () => {
        const ctx = context(new ExecutionBudget(500_000, { maxWorkUnits: 4 }));
        ctx.idx = 200;
        const ta = new TechnicalAnalysis(ctx);
        const source = Array.from({ length: 201 }, (_, i) => 201 - i);

        expect(() => ta.percentile_linear_interpolation(source, 100, 50)).toThrow(PineRuntimeError);
        const state = ctx.taState['pli_100_50'];
        expect(state.arr).toHaveLength(0);
        expect(state.carry.h.size).toBe(0);
    });

    it('precharges a real percentile fill after skipped bars', () => {
        const ctx = context(new ExecutionBudget(500_000, { maxWorkUnits: 1_000 }));
        const ta = new TechnicalAnalysis(ctx);
        ta.percentile_linear_interpolation([201], 100, 50);
        const state = ctx.taState['pli_100_50'];
        const priorHistorySize = state.carry.h.size;
        const priorSortedSize = state.arr.length;

        ctx.idx = 200;
        const source = Array.from({ length: 201 }, (_, i) => 201 - i);
        expect(() => ta.percentile_linear_interpolation(source, 100, 50)).toThrow(PineRuntimeError);
        expect(state.carry.h.size).toBe(priorHistorySize);
        expect(state.arr).toHaveLength(priorSortedSize);
    });

    it('charges keyless cross lookback across na bars', () => {
        const source = new Series(new Array(1_001).fill(NaN));
        const ctx = context(new ExecutionBudget(500_000, { maxWorkUnits: 10 }));
        ctx.idx = 1_000;
        expect(() => crossPair(ctx, undefined, source, source)).toThrow(PineRuntimeError);
    });
});
