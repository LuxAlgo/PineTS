// SPDX-License-Identifier: AGPL-3.0-only

import { Kline } from './types';
import { ParsedTimeframe, parseTimeframe, timeframeBarEnd, timeframeBarStart, timeframeSeconds } from '../timeframe';

export interface AggregationOptions {
    /**
     * Group sub-candles on TradingView's UTC calendar grid ({@link timeframeBarStart}) and stamp
     * each bar with its grid open / close time. Right for UTC 24/7 sources (crypto). When false,
     * intraday targets group by count and session gaps, and bars keep their first sub-candle's
     * open time and last sub-candle's close time.
     */
    calendarGrid?: boolean;
}

const isCalendarUnit = (tf: ParsedTimeframe) => tf.unit === 'D' || tf.unit === 'W' || tf.unit === 'M';
// Bars whose length varies with the calendar (year restarts, month lengths): never a fixed count of sub-candles.
const isGridOnly = (tf: ParsedTimeframe) => isCalendarUnit(tf) && !(tf.unit === 'D' && tf.multiplier === 1);

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Given a target timeframe and a set of supported timeframes, select the
 * best sub-timeframe to aggregate from.
 *
 * Strategy:
 * - **W / M units and multi-day targets**: always `'D'` (calendar-based grouping).
 * - **All others** (including `'D'`): pick the largest supported intraday timeframe whose duration
 *   evenly divides the target duration.
 *
 * @returns The best sub-timeframe, or `null` if none found.
 */
export function selectSubTimeframe(
    targetTimeframe: string,
    supportedTimeframes: Set<string>,
): string | null {
    const target = parseTimeframe(targetTimeframe);
    if (!target) return null;

    if (isGridOnly(target)) {
        return supportedTimeframes.has('D') ? 'D' : null;
    }

    const targetSeconds = timeframeSeconds(target);
    let best: string | null = null;
    let bestSeconds = 0;
    for (const tf of supportedTimeframes) {
        const sub = parseTimeframe(tf);
        if (!sub || isCalendarUnit(sub)) continue;
        const subSeconds = timeframeSeconds(sub);
        if (subSeconds < targetSeconds && targetSeconds % subSeconds === 0 && subSeconds > bestSeconds) {
            best = tf;
            bestSeconds = subSeconds;
        }
    }
    return best;
}

/**
 * Compute how many sub-candles fit into one aggregated candle.
 *
 * For fixed-duration aggregation: `targetSeconds / subSeconds`.
 * For calendar-based targets (W / M units, multi-day): returns `Infinity` to signal variable grouping.
 */
export function getAggregationRatio(targetTimeframe: string, subTimeframe: string): number {
    const target = parseTimeframe(targetTimeframe);
    const sub = parseTimeframe(subTimeframe);
    if (!target || !sub || isGridOnly(target)) return Infinity;
    return timeframeSeconds(target) / timeframeSeconds(sub);
}

/** Approximate number of sub-candles per aggregated candle, finite for every pair (for fetch limits). */
export function getApproximateRatio(targetTimeframe: string, subTimeframe: string): number {
    const target = parseTimeframe(targetTimeframe);
    const sub = parseTimeframe(subTimeframe);
    if (!target || !sub) return 1;
    return timeframeSeconds(target) / timeframeSeconds(sub);
}

/**
 * Aggregate sub-candles into higher-timeframe candles.
 *
 * - **Calendar targets** (W / M units, multi-day) group by the calendar bar each sub-candle opens
 *   in: N days from January 1, N weeks from the first Monday of the year, N months from January.
 * - **Intraday and 1D targets** group on the UTC calendar grid with `calendarGrid`, otherwise
 *   every N consecutive sub-candles with session-boundary detection (no cross-session merging).
 *
 * OHLCV merge:
 * - `open` = first sub-candle's open
 * - `high` = max of all highs
 * - `low`  = min of all lows
 * - `close` = last sub-candle's close
 * - `volume` = sum
 */
export function aggregateCandles(
    subCandles: Kline[],
    targetTimeframe: string,
    subTimeframe: string,
    options: AggregationOptions = {},
): Kline[] {
    if (subCandles.length === 0) return [];
    const target = parseTimeframe(targetTimeframe);
    if (!target) return [];

    if (options.calendarGrid || isGridOnly(target)) {
        return _aggregateByGrid(subCandles, target, !!options.calendarGrid);
    }

    // Fixed-ratio aggregation with session-boundary detection
    const ratio = getAggregationRatio(targetTimeframe, subTimeframe);
    return _aggregateByRatio(subCandles, ratio);
}

// ── Internal helpers ────────────────────────────────────────────────────

/** Group candles by the bar of `target` their open time falls in. */
function _aggregateByGrid(candles: Kline[], target: ParsedTimeframe, stampGrid: boolean): Kline[] {
    const result: Kline[] = [];
    let group: Kline[] = [];
    let groupStart = NaN;

    const flush = () => {
        const bar = _mergeGroup(group);
        if (stampGrid) {
            bar.openTime = groupStart;
            bar.closeTime = timeframeBarEnd(groupStart, target);
        }
        result.push(bar);
    };

    for (const candle of candles) {
        const start = timeframeBarStart(candle.openTime, target);
        if (group.length > 0 && start !== groupStart) {
            flush();
            group = [];
        }
        groupStart = start;
        group.push(candle);
    }
    if (group.length > 0) flush();
    return result;
}

/**
 * Fixed-ratio aggregation with session-boundary detection.
 *
 * Starts a new group whenever:
 * - The current group has `ratio` bars, OR
 * - The time gap between consecutive bars exceeds 1.5× the expected sub-candle
 *   duration (indicates an overnight/weekend/holiday gap for stocks;
 *   transparent for 24/7 crypto where gaps don't occur).
 */
function _aggregateByRatio(candles: Kline[], ratio: number): Kline[] {
    if (candles.length === 0) return [];

    const result: Kline[] = [];
    let group: Kline[] = [candles[0]];

    // Expected gap between consecutive sub-candles (ms).
    // Use the median of the first few gaps to be robust against a single outlier.
    const expectedGapMs = _estimateExpectedGap(candles);
    const maxGapMs = expectedGapMs > 0 ? expectedGapMs * 1.5 : 0;

    for (let i = 1; i < candles.length; i++) {
        const gap = candles[i].openTime - candles[i - 1].openTime;
        const isSessionBreak = maxGapMs > 0 && gap > maxGapMs;

        if (isSessionBreak || group.length >= ratio) {
            result.push(_mergeGroup(group));
            group = [];
        }
        group.push(candles[i]);
    }

    if (group.length > 0) {
        result.push(_mergeGroup(group));
    }

    return result;
}

/** Merge a group of candles into a single aggregated candle. */
function _mergeGroup(group: Kline[]): Kline {
    const first = group[0];
    const last = group[group.length - 1];

    let high = first.high;
    let low = first.low;
    let volume = 0;
    let quoteAssetVolume = 0;
    let numberOfTrades = 0;
    let takerBuyBaseAssetVolume = 0;
    let takerBuyQuoteAssetVolume = 0;

    for (let i = 0; i < group.length; i++) {
        const c = group[i];
        if (c.high > high) high = c.high;
        if (c.low < low) low = c.low;
        volume += c.volume;
        quoteAssetVolume += c.quoteAssetVolume;
        numberOfTrades += c.numberOfTrades;
        takerBuyBaseAssetVolume += c.takerBuyBaseAssetVolume;
        takerBuyQuoteAssetVolume += c.takerBuyQuoteAssetVolume;
    }

    return {
        openTime: first.openTime,
        open: first.open,
        high,
        low,
        close: last.close,
        volume,
        closeTime: last.closeTime,
        quoteAssetVolume,
        numberOfTrades,
        takerBuyBaseAssetVolume,
        takerBuyQuoteAssetVolume,
        ignore: 0,
    };
}

/**
 * Estimate the expected gap (ms) between consecutive sub-candles.
 * Uses the minimum gap among the first few pairs — this naturally
 * picks the intra-session gap and ignores overnight/weekend gaps.
 */
function _estimateExpectedGap(candles: Kline[]): number {
    if (candles.length < 2) return 0;

    const samplesToCheck = Math.min(candles.length - 1, 20);
    let minGap = Infinity;

    for (let i = 0; i < samplesToCheck; i++) {
        const gap = candles[i + 1].openTime - candles[i].openTime;
        if (gap > 0 && gap < minGap) minGap = gap;
    }

    return minGap === Infinity ? 0 : minGap;
}
