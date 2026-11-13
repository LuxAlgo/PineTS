// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { nonNaWindow } from './nonNaWindow';
import { assertTaLength } from './assertTaLength';
import type { ExecutionBudget } from '../../../security/ExecutionBudget';

/**
 * Pivot high (low) confirmed at index `i` of `source` (oldest first), as on TradingView (since
 * 2026-10-09): the value `rightbars` bars before `i`, when it is the highest (lowest) of the last
 * `leftbars + rightbars + 1` non-na values, and no newer one equals it (an older equal value does not
 * disqualify it). An na value is skipped, so the window then reaches further back. From bar `i =
 * leftbars + rightbars` on the window may hold fewer values (as ta.highest). NaN otherwise.
 */
export function pivotAt(source: number[], i: number, leftbars: number, rightbars: number, high: boolean, budget?: ExecutionBudget): number {
    assertTaLength(leftbars + rightbars + 1, 'ta.pivot');
    const c = i - rightbars;
    const p = source[c];
    if (!(c >= 0) || p === undefined || p === null || isNaN(p)) return NaN;
    if (i < leftbars + rightbars) return NaN;
    let n = 0;
    for (let j = i; j >= 0 && n < leftbars + rightbars + 1; j--) {
        budget?.chargeWork(1, 'ta.pivot');
        const v = source[j];
        if (v === undefined || v === null || isNaN(v)) continue;
        n++;
        if (j === c) continue;
        // a newer value equal to the candidate takes its place; an older one does not
        if (high ? v > p || (j > c && v === p) : v < p || (j > c && v === p)) return NaN;
    }
    return p;
}

/**
 * Pivot high (low) confirmed on the current bar. With a key, over the last `leftbars + rightbars + 1`
 * non-na values of the calls (nonNaWindow, fewer of them from bar_index `leftbars + rightbars` on, as
 * ta.highest): the call `rightbars` bars back is the pivot when it holds the window's extreme, the
 * newest among equal values. Without one the source series is read.
 */
export function pivot(context: any, key: string | undefined, source: any, leftbars: number, rightbars: number, high: boolean): number | undefined {
    assertTaLength(leftbars + rightbars + 1, 'ta.pivot');
    if (!key) return pivotAt(Series.from(source).toArray(), context.idx, leftbars, rightbars, high, context.executionBudget);

    const win = nonNaWindow(context, key, Series.from(source), leftbars + rightbars + 1, 'extremes', undefined, 'bars');
    if (!win || !(rightbars >= 0)) return NaN;
    const bar = high ? win.maxBar() : win.minBar();
    return bar === context.idx - rightbars ? (high ? win.max() : win.min()) : NaN;
}
