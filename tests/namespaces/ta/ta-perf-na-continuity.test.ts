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
type Plot = { readonly data: readonly PlotPoint[] };
type PlotMap = Record<string, Plot | undefined>;

const DAY_MS = 86_400_000;
const LENGTH = 5;
const MULT = 2;

function makeBars(): readonly Bar[] {
    return Array.from({ length: 90 }, (_, i) => {
        const close = 100 + ((i * 17) % 29) - (i % 5) * 2 + Math.sin(i / 3) * 4;
        const hasGap = i % 7 === 0 || i === 38 || i === 39;
        return {
            openTime: Date.UTC(2024, 0, 1) + i * DAY_MS,
            closeTime: Date.UTC(2024, 0, 1) + (i + 1) * DAY_MS,
            open: close + (i % 3 === 0 ? 2.5 : -1.5),
            high: hasGap ? NaN : close + 4 + (i % 4),
            low: hasGap ? NaN : close - 3 - (i % 3),
            close: hasGap ? NaN : close,
            volume: 1000 + i * 7,
        };
    });
}

function precision(value: number): number {
    return Number.isFinite(value) ? Math.round(value * 1e10) / 1e10 : NaN;
}

function valuesFor(source: readonly number[], index: number, length: number): readonly number[] {
    if (index + 1 < length) return [];
    return source.slice(index + 1 - length, index + 1).reverse();
}

function allFinite(values: readonly number[]): boolean {
    return values.length > 0 && values.every(Number.isFinite);
}

function sma(source: readonly number[], index: number): number {
    const values = valuesFor(source, index, LENGTH);
    return allFinite(values) ? precision(values.reduce((sum, value) => sum + value, 0) / LENGTH) : NaN;
}

function wma(source: readonly number[], index: number, length = LENGTH): number {
    const values = valuesFor(source, index, length);
    if (!allFinite(values)) return NaN;
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < length; i += 1) {
        const weight = length - i;
        numerator += values[i] * weight;
        denominator += weight;
    }
    return precision(numerator / denominator);
}

function highest(source: readonly number[], index: number): number {
    const values = valuesFor(source, index, LENGTH).filter(Number.isFinite);
    return index + 1 < LENGTH || values.length === 0 ? NaN : precision(Math.max(...values));
}

function lowest(source: readonly number[], index: number): number {
    const values = valuesFor(source, index, LENGTH).filter(Number.isFinite);
    return index + 1 < LENGTH || values.length === 0 ? NaN : precision(Math.min(...values));
}

function stdev(source: readonly number[], index: number): number {
    const values = valuesFor(source, index, LENGTH);
    if (!allFinite(values)) return NaN;
    const mean = values.reduce((sum, value) => sum + value, 0) / LENGTH;
    const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / LENGTH;
    return precision(Math.sqrt(variance));
}

function bb(source: readonly number[], index: number): readonly [number, number, number] {
    const middle = sma(source, index);
    const deviation = stdev(source, index);
    return Number.isNaN(middle) || Number.isNaN(deviation)
        ? [NaN, NaN, NaN]
        : [middle, precision(middle + MULT * deviation), precision(middle - MULT * deviation)];
}

function cci(source: readonly number[]): readonly number[] {
    const out = Array.from<number>({ length: source.length }).fill(NaN);
    const values: number[] = [];
    for (let i = 0; i < source.length; i += 1) {
        const value = source[i];
        if (!Number.isFinite(value)) continue;
        values.push(value);
        if (values.length > LENGTH) values.shift();
        if (values.length < LENGTH) continue;
        const average = values.reduce((sum, item) => sum + item, 0) / LENGTH;
        const meanDeviation = values.reduce((sum, item) => sum + Math.abs(item - average), 0) / LENGTH;
        out[i] = meanDeviation === 0 ? 0 : precision((value - average) / (0.015 * meanDeviation));
    }
    return out;
}

function hma(source: readonly number[], index: number): number {
    const half = Math.floor(LENGTH / 2);
    const sqrt = Math.floor(Math.sqrt(LENGTH));
    const raw: number[] = [];
    for (let offset = sqrt - 1; offset >= 0; offset -= 1) {
        const rawIndex = index - offset;
        const fast = wma(source, rawIndex, half);
        const slow = wma(source, rawIndex, LENGTH);
        raw.push(Number.isNaN(fast) || Number.isNaN(slow) ? NaN : 2 * fast - slow);
    }
    return raw.length < sqrt || raw.some(Number.isNaN) ? NaN : wma(raw, raw.length - 1, sqrt);
}

function ema(source: readonly number[]): readonly number[] {
    const out = Array.from<number>({ length: source.length }).fill(NaN);
    let initSum = 0;
    let initCount = 0;
    let previous = NaN;
    const alpha = 2 / (LENGTH + 1);
    for (let i = 0; i < source.length; i += 1) {
        const value = source[i];
        if (!Number.isFinite(value)) continue;
        if (initCount < LENGTH) {
            initSum += value;
            initCount += 1;
            if (initCount === LENGTH) previous = initSum / LENGTH;
        } else {
            previous = value * alpha + previous * (1 - alpha);
        }
        out[i] = initCount < LENGTH ? NaN : precision(previous);
    }
    return out;
}

function rsi(source: readonly number[]): readonly number[] {
    const out = Array.from<number>({ length: source.length }).fill(NaN);
    let previousValue = NaN;
    const gains: number[] = [];
    const losses: number[] = [];
    let avgGain = 0;
    let avgLoss = 0;
    for (let i = 0; i < source.length; i += 1) {
        const value = source[i];
        if (!Number.isFinite(value)) continue;
        if (Number.isNaN(previousValue)) {
            previousValue = value;
            continue;
        }
        const diff = value - previousValue;
        const gain = Math.max(diff, 0);
        const loss = Math.max(-diff, 0);
        if (gains.length < LENGTH) {
            gains.push(gain);
            losses.push(loss);
            if (gains.length === LENGTH) {
                avgGain = gains.reduce((sum, item) => sum + item, 0) / LENGTH;
                avgLoss = losses.reduce((sum, item) => sum + item, 0) / LENGTH;
            }
        } else {
            avgGain = (avgGain * (LENGTH - 1) + gain) / LENGTH;
            avgLoss = (avgLoss * (LENGTH - 1) + loss) / LENGTH;
        }
        previousValue = value;
        out[i] = gains.length < LENGTH ? NaN : precision(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
    }
    return out;
}

function atr(bars: readonly Bar[]): readonly number[] {
    const out = Array.from<number>({ length: bars.length }).fill(NaN);
    let initSum = 0;
    let initCount = 0;
    let previous = NaN;
    for (let i = 0; i < bars.length; i += 1) {
        const bar = bars[i];
        if (!Number.isFinite(bar.high) || !Number.isFinite(bar.low) || !Number.isFinite(bar.close)) continue;
        const prevClose = i > 0 ? bars[i - 1].close : NaN;
        const tr = Number.isFinite(prevClose)
            ? Math.max(bar.high - bar.low, Math.abs(bar.high - prevClose), Math.abs(bar.low - prevClose))
            : bar.high - bar.low;
        if (initCount < LENGTH) {
            initSum += tr;
            initCount += 1;
            if (initCount === LENGTH) previous = initSum / LENGTH;
        } else {
            previous = (previous * (LENGTH - 1) + tr) / LENGTH;
        }
        out[i] = initCount < LENGTH ? NaN : precision(previous);
    }
    return out;
}

function plotValues(plots: PlotMap, name: string): readonly number[] {
    const plot = plots[name];
    expect(plot, `${name} plot should exist`).toBeDefined();
    return plot?.data.map((point) => point.value) ?? [];
}

function expectSeriesClose(actual: readonly number[], expected: readonly number[], name: string): void {
    for (let i = 0; i < expected.length; i += 1) {
        if (Number.isNaN(expected[i])) {
            expect(Number.isNaN(actual[i]), `${name}[${i}] expected NaN, got ${actual[i]}`).toBe(true);
        } else {
            expect(actual[i], `${name}[${i}]`).toBeCloseTo(expected[i], 8);
        }
    }
}

describe('TA perf optimizations - na continuity gaps', () => {
    it('keeps optimized TA outputs aligned across source and OHLC NaN gaps', async () => {
        const bars = makeBars();
        const close = bars.map((bar) => bar.close);
        const pineTS = new PineTS([...bars], 'TEST', 'D');
        const { plots } = await pineTS.run(`
//@version=6
indicator("ta perf na continuity regression")
sma_gap = ta.sma(close, 5)
wma_gap = ta.wma(close, 5)
highest_gap = ta.highest(close, 5)
lowest_gap = ta.lowest(close, 5)
stdev_gap = ta.stdev(close, 5)
[bb_mid_gap, bb_upper_gap, bb_lower_gap] = ta.bb(close, 5, 2)
cci_gap = ta.cci(close, 5)
hma_gap = ta.hma(close, 5)
ema_gap = ta.ema(close, 5)
rsi_gap = ta.rsi(close, 5)
atr_gap = ta.atr(5)
plot(sma_gap, "sma")
plot(wma_gap, "wma")
plot(highest_gap, "highest")
plot(lowest_gap, "lowest")
plot(stdev_gap, "stdev")
plot(bb_mid_gap, "bb_mid")
plot(bb_upper_gap, "bb_upper")
plot(bb_lower_gap, "bb_lower")
plot(cci_gap, "cci")
plot(hma_gap, "hma")
plot(ema_gap, "ema")
plot(rsi_gap, "rsi")
plot(atr_gap, "atr")
`);
        const plotMap: PlotMap = plots;
        expectSeriesClose(plotValues(plotMap, 'sma'), close.map((_, i) => sma(close, i)), 'sma');
        expectSeriesClose(plotValues(plotMap, 'wma'), close.map((_, i) => wma(close, i)), 'wma');
        expectSeriesClose(plotValues(plotMap, 'highest'), close.map((_, i) => highest(close, i)), 'highest');
        expectSeriesClose(plotValues(plotMap, 'lowest'), close.map((_, i) => lowest(close, i)), 'lowest');
        expectSeriesClose(plotValues(plotMap, 'stdev'), close.map((_, i) => stdev(close, i)), 'stdev');
        expectSeriesClose(plotValues(plotMap, 'bb_mid'), close.map((_, i) => bb(close, i)[0]), 'bb_mid');
        expectSeriesClose(plotValues(plotMap, 'bb_upper'), close.map((_, i) => bb(close, i)[1]), 'bb_upper');
        expectSeriesClose(plotValues(plotMap, 'bb_lower'), close.map((_, i) => bb(close, i)[2]), 'bb_lower');
        expectSeriesClose(plotValues(plotMap, 'cci'), cci(close), 'cci');
        expectSeriesClose(plotValues(plotMap, 'hma'), close.map((_, i) => hma(close, i)), 'hma');
        expectSeriesClose(plotValues(plotMap, 'ema'), ema(close), 'ema');
        expectSeriesClose(plotValues(plotMap, 'rsi'), rsi(close), 'rsi');
        expectSeriesClose(plotValues(plotMap, 'atr'), atr(bars), 'atr');
    });
});
