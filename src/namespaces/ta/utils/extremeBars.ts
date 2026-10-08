// SPDX-License-Identifier: AGPL-3.0-only

import { TvExtreme } from './barRing';

const nanLike = (v: any) => v === undefined || isNaN(v);

/**
 * Offset (<= 0) of the highest (lowest) value of the last `length` bars, the oldest bar among equal
 * values; only the bars since the most recent na take part and an na current value gives 0. In a local
 * block, TradingView's own algorithm (TvExtreme).
 */
export function extremeBarsOffset(context: any, key: string | undefined, series: any, length: number, max: boolean): number {
    if (!key) return extremeBarsScan(series, length, max);
    if (!context.taState) context.taState = {};
    const w: TvExtreme = (context.taState[key] ??= new TvExtreme(max));
    const bar = w.step(context.idx, series.get(0), length, series);
    if (bar < 0) return 0;
    // -0 when the current bar wins: the offset is -i for i = 0
    return bar === context.idx ? -0 : bar - context.idx;
}

/** The same, scanning the series (no state). */
export function extremeBarsScan(series: any, length: number, max: boolean): number {
    let best = max ? -Infinity : Infinity;
    let bestOffset = NaN;
    for (let i = 0; i < length; i++) {
        const val = series.get(i);
        if (nanLike(val)) break;
        // `>=` (`<=`) so that, scanning newest → oldest, an older bar with the same value
        // overwrites: TradingView returns the offset of the OLDEST bar among ties.
        if (isNaN(bestOffset) || (max ? val >= best : val <= best)) {
            best = val;
            bestOffset = -i;
        }
    }
    return isNaN(bestOffset) ? 0 : bestOffset;
}
