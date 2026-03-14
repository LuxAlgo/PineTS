// SPDX-License-Identifier: AGPL-3.0-only

import { Kline, TIMEFRAME_SECONDS } from './types';

// ── Ordered list of all canonical timeframes (ascending by duration) ────

const ORDERED_TIMEFRAMES = [
    '1S', '5S', '10S', '15S', '30S',
    '1', '3', '5', '15', '30', '45',
    '60', '120', '180', '240',
    'D', 'W', 'M',
];

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Given a target timeframe and a set of supported timeframes, select the
 * best sub-timeframe to aggregate from.
 *
 * Strategy:
 * - **W/M targets**: always use `'D'` (calendar-based grouping).
 * - **All others**: pick the largest supported timeframe whose duration
 *   evenly divides the target duration (using `TIMEFRAME_SECONDS`).
 *
 * @returns The best sub-timeframe, or `null` if none found.
 */
export function selectSubTimeframe(
    targetTimeframe: string,
    supportedTimeframes: Set<string>,
): string | null {
    // Weekly and Monthly always aggregate from Daily
    if (targetTimeframe === 'W' || targetTimeframe === 'M') {
        return supportedTimeframes.has('D') ? 'D' : null;
    }

    const targetSeconds = TIMEFRAME_SECONDS[targetTimeframe];
    if (!targetSeconds) return null;

    // Consider only timeframes strictly smaller than the target
    const candidates = ORDERED_TIMEFRAMES.filter(tf =>
        tf !== 'W' && tf !== 'M' &&
        supportedTimeframes.has(tf) &&
        TIMEFRAME_SECONDS[tf] < targetSeconds &&
        targetSeconds % TIMEFRAME_SECONDS[tf] === 0,
    );

    if (candidates.length === 0) return null;

    // Pick the largest (last in ascending order) — fewest API calls
    return candidates[candidates.length - 1];
}

/**
 * Compute how many sub-candles fit into one aggregated candle.
 *
 * For fixed-duration aggregation: `targetSeconds / subSeconds`.
 * For calendar-based (W/M from D): returns `Infinity` to signal variable grouping.
 */
export function getAggregationRatio(targetTimeframe: string, subTimeframe: string): number {
    if (targetTimeframe === 'W' || targetTimeframe === 'M') {
        return Infinity; // Calendar-based grouping — variable bars per group
    }
    const targetSec = TIMEFRAME_SECONDS[targetTimeframe];
    const subSec = TIMEFRAME_SECONDS[subTimeframe];
    if (!targetSec || !subSec || subSec === 0) return Infinity;
    return targetSec / subSec;
}

/**
 * Aggregate sub-candles into higher-timeframe candles.
 *
 * Three modes:
 * 1. **Fixed-ratio** (intraday → higher intraday): groups every N consecutive
 *    sub-candles, with session-boundary detection to avoid cross-session merging.
 * 2. **Weekly from daily**: groups daily bars by ISO week number.
 * 3. **Monthly from daily**: groups daily bars by calendar year+month.
 *
 * OHLCV merge:
 * - `open` = first sub-candle's open
 * - `high` = max of all highs
 * - `low`  = min of all lows
 * - `close` = last sub-candle's close
 * - `volume` = sum
 * - `closeTime` = last sub-candle's closeTime (preserves session-aware close)
 */
export function aggregateCandles(
    subCandles: Kline[],
    targetTimeframe: string,
    subTimeframe: string,
): Kline[] {
    if (subCandles.length === 0) return [];

    if (targetTimeframe === 'W') {
        return _aggregateByWeek(subCandles);
    }
    if (targetTimeframe === 'M') {
        return _aggregateByMonth(subCandles);
    }

    // Fixed-ratio aggregation with session-boundary detection
    const ratio = getAggregationRatio(targetTimeframe, subTimeframe);
    return _aggregateByRatio(subCandles, ratio);
}

// ── Internal helpers ────────────────────────────────────────────────────

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

/** Group daily candles by ISO week. */
function _aggregateByWeek(dailyCandles: Kline[]): Kline[] {
    const groups: Kline[][] = [];
    let currentGroup: Kline[] = [];
    let currentWeekKey = '';

    for (const candle of dailyCandles) {
        const weekKey = _getISOWeekKey(candle.openTime);
        if (weekKey !== currentWeekKey && currentGroup.length > 0) {
            groups.push(currentGroup);
            currentGroup = [];
        }
        currentWeekKey = weekKey;
        currentGroup.push(candle);
    }
    if (currentGroup.length > 0) groups.push(currentGroup);

    return groups.map(_mergeGroup);
}

/** Group daily candles by calendar month. */
function _aggregateByMonth(dailyCandles: Kline[]): Kline[] {
    const groups: Kline[][] = [];
    let currentGroup: Kline[] = [];
    let currentMonthKey = '';

    for (const candle of dailyCandles) {
        const d = new Date(candle.openTime);
        const monthKey = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
        if (monthKey !== currentMonthKey && currentGroup.length > 0) {
            groups.push(currentGroup);
            currentGroup = [];
        }
        currentMonthKey = monthKey;
        currentGroup.push(candle);
    }
    if (currentGroup.length > 0) groups.push(currentGroup);

    return groups.map(_mergeGroup);
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

/** Return "YYYY-WNN" ISO week key for a UTC timestamp. */
function _getISOWeekKey(timestampMs: number): string {
    const d = new Date(timestampMs);
    const dayNum = d.getUTCDay() || 7; // Make Sunday = 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum); // Set to nearest Thursday
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNo}`;
}
