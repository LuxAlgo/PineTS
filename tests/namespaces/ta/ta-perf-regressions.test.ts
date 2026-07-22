import { describe, expect, it } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';

type Bar = {
    readonly openTime: number;
    readonly closeTime: number;
    readonly open: number;
    readonly high: number;
    readonly low: number;
    readonly close: number;
    readonly volume: number;
};

type PlotPoint = { readonly value: number };

const DAY_MS = 86_400_000;
const MULT = 2;

function makeBars(): readonly Bar[] {
    return Array.from({ length: 90 }, (_, i) => {
        const close = 100 + ((i * 17) % 29) - (i % 5) * 2 + Math.sin(i / 3) * 4;
        return {
            openTime: Date.UTC(2024, 0, 1) + i * DAY_MS,
            closeTime: Date.UTC(2024, 0, 1) + (i + 1) * DAY_MS,
            open: close + (i % 3 === 0 ? 2.5 : -1.5),
            high: close + 4 + (i % 4),
            low: close - 3 - (i % 3),
            close,
            volume: 1000 + i * 7,
        };
    });
}

function precision(value: number): number {
    return Number.isFinite(value) ? Math.round(value * 1e10) / 1e10 : NaN;
}

function valuesFor(source: readonly number[], index: number, length: number): readonly number[] {
    if (length <= 0 || index + 1 < length) return [];
    return source.slice(index + 1 - length, index + 1).reverse();
}

function sma(source: readonly number[], index: number, length: number): number {
    const values = valuesFor(source, index, length);
    return values.length < length ? NaN : precision(values.reduce((sum, value) => sum + value, 0) / length);
}

function wma(source: readonly number[], index: number, length: number): number {
    const values = valuesFor(source, index, length);
    if (values.length < length) return NaN;
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < length; i += 1) {
        const weight = length - i;
        numerator += values[i] * weight;
        denominator += weight;
    }
    return precision(numerator / denominator);
}

function highest(source: readonly number[], index: number, length: number): number {
    const values = valuesFor(source, index, length);
    return values.length < length ? NaN : precision(Math.max(...values));
}

function lowest(source: readonly number[], index: number, length: number): number {
    const values = valuesFor(source, index, length);
    return values.length < length ? NaN : precision(Math.min(...values));
}

function stdev(source: readonly number[], index: number, length: number): number {
    const values = valuesFor(source, index, length);
    if (values.length < length) return NaN;
    const mean = values.reduce((sum, value) => sum + value, 0) / length;
    const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / length;
    return precision(Math.sqrt(variance));
}

function bb(source: readonly number[], index: number, length: number): readonly [number, number, number] {
    const middle = sma(source, index, length);
    const deviation = stdev(source, index, length);
    return Number.isNaN(middle) || Number.isNaN(deviation)
        ? [NaN, NaN, NaN]
        : [middle, precision(middle + MULT * deviation), precision(middle - MULT * deviation)];
}

function cci(source: readonly number[], index: number, length: number): number {
    const values = valuesFor(source, index, length);
    if (values.length < length) return NaN;
    const average = values.reduce((sum, value) => sum + value, 0) / length;
    const meanDeviation = values.reduce((sum, value) => sum + Math.abs(value - average), 0) / length;
    return meanDeviation === 0 ? 0 : precision((source[index] - average) / (0.015 * meanDeviation));
}

function hma(source: readonly number[], index: number, length: number): number {
    const half = Math.floor(length / 2);
    const sqrt = Math.floor(Math.sqrt(length));
    const raw: number[] = [];
    for (let offset = sqrt - 1; offset >= 0; offset -= 1) {
        const rawIndex = index - offset;
        const fast = wma(source, rawIndex, half);
        const slow = wma(source, rawIndex, length);
        raw.push(Number.isNaN(fast) || Number.isNaN(slow) ? NaN : 2 * fast - slow);
    }
    if (raw.length < sqrt || raw.some(Number.isNaN)) return NaN;
    return wma(raw, raw.length - 1, sqrt);
}

function emaWhenCalled(source: readonly number[], period: number, shouldCall: (index: number) => boolean): readonly number[] {
    const out = Array.from<number>({ length: source.length }).fill(NaN);
    let initSum = 0;
    let initCount = 0;
    let previous = NaN;
    const alpha = 2 / (period + 1);
    for (let i = 0; i < source.length; i += 1) {
        if (!shouldCall(i)) continue;
        if (initCount < period) {
            initSum += source[i];
            initCount += 1;
            if (initCount === period) previous = initSum / period;
        } else {
            previous = source[i] * alpha + previous * (1 - alpha);
        }
        out[i] = initCount < period ? NaN : precision(previous);
    }
    return out;
}

function atrWhenCalled(bars: readonly Bar[], period: number, shouldCall: (index: number) => boolean): readonly number[] {
    const out = Array.from<number>({ length: bars.length }).fill(NaN);
    let initSum = 0;
    let initCount = 0;
    let previous = NaN;
    for (let i = 0; i < bars.length; i += 1) {
        if (!shouldCall(i)) continue;
        const prevClose = i > 0 ? bars[i - 1].close : NaN;
        const tr = Number.isNaN(prevClose)
            ? bars[i].high - bars[i].low
            : Math.max(bars[i].high - bars[i].low, Math.abs(bars[i].high - prevClose), Math.abs(bars[i].low - prevClose));
        if (initCount < period) {
            initSum += tr;
            initCount += 1;
            if (initCount === period) previous = initSum / period;
        } else {
            previous = (previous * (period - 1) + tr) / period;
        }
        out[i] = initCount < period ? NaN : precision(previous);
    }
    return out;
}

function rsiWhenCalled(source: readonly number[], period: number, shouldCall: (index: number) => boolean): readonly number[] {
    const out = Array.from<number>({ length: source.length }).fill(NaN);
    let previousValue = NaN;
    const gains: number[] = [];
    const losses: number[] = [];
    let avgGain = 0;
    let avgLoss = 0;
    for (let i = 0; i < source.length; i += 1) {
        if (!shouldCall(i)) continue;
        if (Number.isNaN(previousValue)) {
            previousValue = source[i];
            continue;
        }
        const diff = source[i] - previousValue;
        const gain = Math.max(diff, 0);
        const loss = Math.max(-diff, 0);
        if (gains.length < period) {
            gains.push(gain);
            losses.push(loss);
            if (gains.length === period) {
                avgGain = gains.reduce((sum, value) => sum + value, 0) / period;
                avgLoss = losses.reduce((sum, value) => sum + value, 0) / period;
            }
        } else {
            avgGain = (avgGain * (period - 1) + gain) / period;
            avgLoss = (avgLoss * (period - 1) + loss) / period;
        }
        previousValue = source[i];
        out[i] = gains.length < period ? NaN : precision(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
    }
    return out;
}

function expectSeriesClose(actual: readonly PlotPoint[], expected: readonly number[], start: number, name: string): void {
    for (let i = start; i < expected.length; i += 1) {
        const value = actual[i].value;
        if (Number.isNaN(expected[i])) {
            expect(Number.isNaN(value), `${name}[${i}] expected NaN, got ${value}`).toBe(true);
        } else {
            expect(value, `${name}[${i}]`).toBeCloseTo(expected[i], 8);
        }
    }
}

describe('TA perf optimizations - non-steady-state parity', () => {
    it('keeps dynamic length rolling outputs aligned with stateless recompute', async () => {
        const bars = makeBars();
        const close = bars.map((bar) => bar.close);
        const pineTS = new PineTS([...bars], 'TEST', 'D');
        const { plots } = await pineTS.run(`
//@version=6
indicator("ta perf dynamic length regression")
len = bar_index % 2 == 0 ? 5 : 10
sma_dyn = ta.sma(close, len)
wma_dyn = ta.wma(close, len)
highest_dyn = ta.highest(close, len)
lowest_dyn = ta.lowest(close, len)
stdev_dyn = ta.stdev(close, len)
[bb_mid_dyn, bb_upper_dyn, bb_lower_dyn] = ta.bb(close, len, 2)
cci_dyn = ta.cci(close, len)
hma_dyn = ta.hma(close, len)
plot(sma_dyn, "sma")
plot(wma_dyn, "wma")
plot(highest_dyn, "highest")
plot(lowest_dyn, "lowest")
plot(stdev_dyn, "stdev")
plot(bb_mid_dyn, "bb_mid")
plot(bb_upper_dyn, "bb_upper")
plot(bb_lower_dyn, "bb_lower")
plot(cci_dyn, "cci")
plot(hma_dyn, "hma")
`);
        const lengths = close.map((_, index) => (index % 2 === 0 ? 5 : 10));
        const start = 30;
        expectSeriesClose(plots.sma.data, close.map((_, i) => sma(close, i, lengths[i])), start, 'sma');
        expectSeriesClose(plots.wma.data, close.map((_, i) => wma(close, i, lengths[i])), start, 'wma');
        expectSeriesClose(plots.highest.data, close.map((_, i) => highest(close, i, lengths[i])), start, 'highest');
        expectSeriesClose(plots.lowest.data, close.map((_, i) => lowest(close, i, lengths[i])), start, 'lowest');
        expectSeriesClose(plots.stdev.data, close.map((_, i) => stdev(close, i, lengths[i])), start, 'stdev');
        expectSeriesClose(plots.bb_mid.data, close.map((_, i) => bb(close, i, lengths[i])[0]), start, 'bb_mid');
        expectSeriesClose(plots.bb_upper.data, close.map((_, i) => bb(close, i, lengths[i])[1]), start, 'bb_upper');
        expectSeriesClose(plots.bb_lower.data, close.map((_, i) => bb(close, i, lengths[i])[2]), start, 'bb_lower');
        expectSeriesClose(plots.cci.data, close.map((_, i) => cci(close, i, lengths[i])), start, 'cci');
        expectSeriesClose(plots.hma.data, close.map((_, i) => hma(close, i, lengths[i])), start, 'hma');
    });

    it('preserves call-site warmup for conditional and sparse recursive functions', async () => {
        const bars = makeBars();
        const close = bars.map((bar) => bar.close);
        const shouldCallConditional = (index: number) => bars[index].close > bars[index].open;
        const shouldCallSparse = (index: number) => index % 5 === 0;
        const pineTS = new PineTS([...bars], 'TEST', 'D');
        const { plots } = await pineTS.run(`
//@version=6
indicator("ta perf conditional regression")
float ema_cond = na
if close > open
    ema_cond := ta.ema(close, 5)
float atr_cond = na
if close > open
    atr_cond := ta.atr(14)
float rsi_sparse = na
if bar_index % 5 == 0
    rsi_sparse := ta.rsi(close, 14)
plot(ema_cond, "ema_cond")
plot(atr_cond, "atr_cond")
plot(rsi_sparse, "rsi_sparse")
`);
        expectSeriesClose(plots.ema_cond.data, emaWhenCalled(close, 5, shouldCallConditional), 0, 'ema_cond');
        expectSeriesClose(plots.atr_cond.data, atrWhenCalled(bars, 14, shouldCallConditional), 0, 'atr_cond');
        expectSeriesClose(plots.rsi_sparse.data, rsiWhenCalled(close, 14, shouldCallSparse), 0, 'rsi_sparse');
    });

    it('preserves conditional highest and lowest call-site history', async () => {
        const bars = makeBars();
        const pineTS = new PineTS([...bars], 'TEST', 'D');
        const { plots } = await pineTS.run(`
//@version=6
indicator("ta perf conditional range regression")
float high_cond = na
float low_cond = na
if close > open
    high_cond := ta.highest(close, 5)
if close > open
    low_cond := ta.lowest(close, 5)
plot(high_cond, "high_cond")
plot(low_cond, "low_cond")
`);
        const expectedHigh = [
            NaN, NaN, NaN, NaN, 116.3087787872, 130.981631831, NaN, 130.981631831,
            130.981631831, NaN, 130.981631831, 130.981631831, NaN, 124.2377281485,
            124.2377281485, NaN, 124.2377281485, 121.687207033,
        ];
        const expectedLow = [
            NaN, NaN, NaN, NaN, 100, 103.4734792123, NaN, 101.892343527,
            101.892343527, NaN, 101.892343527, 101.892343527, NaN, 101.892343527,
            94.0041803316, NaN, 94.0041803316, 94.0041803316,
        ];
        expectSeriesClose(plots.high_cond.data, expectedHigh, 0, 'high_cond');
        expectSeriesClose(plots.low_cond.data, expectedLow, 0, 'low_cond');
    });
});
