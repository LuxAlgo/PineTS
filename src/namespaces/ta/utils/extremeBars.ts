// SPDX-License-Identifier: AGPL-3.0-only

import { nonNaWindow } from './nonNaWindow';
import { validTaLength } from './assertTaLength';
import type { ExecutionBudget } from '../../../security/ExecutionBudget';

const nanLike = (v: any) => v === undefined || isNaN(v);

/**
 * Offset (<= 0) of the highest (lowest) of the last `length` non-na values, the newest bar among equal
 * values: TradingView's ta.highestbars / ta.lowestbars (since 2026-10-09). In a local block the values
 * are those of the calls, and the offset is the number of bars back to the call holding the extreme.
 * As ta.highest, a value from bar_index `length - 1` on, over the fewer non-na values seen until then;
 * NaN while there are none.
 */
export function extremeBarsOffset(context: any, key: string | undefined, series: any, length: number, max: boolean): number {
    if (!validTaLength(length, 'ta.extremebars')) return NaN;
    if (!key) return extremeBarsScan(series, length, max, context.idx, context.executionBudget);
    const win = nonNaWindow(context, key, series, length, 'extremes', undefined, 'bars');
    if (!win) return NaN;
    const bar = max ? win.maxBar() : win.minBar();
    // -0 when the current bar wins: the offset is -i for i = 0
    return bar === context.idx ? -0 : bar - context.idx;
}

/** The same, scanning the series (no state). */
export function extremeBarsScan(series: any, length: number, max: boolean, idx: number, budget?: ExecutionBudget): number {
    if (!validTaLength(length, 'ta.extremebars')) return NaN;
    let best = NaN;
    let bestOffset = NaN;
    let n = 0;
    for (let i = 0; n < length && i <= idx; i++) {
        budget?.chargeWork(1, 'ta.extremebars');
        const val = series.get(i);
        if (nanLike(val)) continue;
        n++;
        // strictly better only: scanning newest -> oldest, the newest bar among equal values wins
        if (isNaN(bestOffset) || (max ? val > best : val < best)) {
            best = val;
            bestOffset = -i;
        }
    }
    return idx < length - 1 || n === 0 ? NaN : bestOffset;
}
