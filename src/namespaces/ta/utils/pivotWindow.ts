// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { nonNaWindow } from './nonNaWindow';

/**
 * Pivot high (low) confirmed at index `i` of `source` (oldest first), as on TradingView (since
 * 2026-10-09): the value `rightbars` bars before `i`, when it is the highest (lowest) of the last
 * `leftbars + rightbars + 1` non-na values, and no newer one equals it (an older equal value does not
 * disqualify it). An na value is skipped, so the window then reaches further back. NaN otherwise.
 */
export function pivotAt(source: number[], i: number, leftbars: number, rightbars: number, high: boolean): number {
    const c = i - rightbars;
    const p = source[c];
    if (!(c >= 0) || p === undefined || p === null || isNaN(p)) return NaN;
    let n = 0;
    for (let j = i; j >= 0 && n < leftbars + rightbars + 1; j--) {
        const v = source[j];
        if (v === undefined || v === null || isNaN(v)) continue;
        n++;
        if (j === c) continue;
        // a newer value equal to the candidate takes its place; an older one does not
        if (high ? v > p || (j > c && v === p) : v < p || (j > c && v === p)) return NaN;
    }
    return n < leftbars + rightbars + 1 ? NaN : p;
}

/**
 * Pivot high (low) confirmed on the current bar. With a key, over the last `leftbars + rightbars + 1`
 * non-na values of the calls (nonNaWindow): the call `rightbars` bars back is the pivot when it holds the
 * window's extreme, the newest among equal values. Without one the source series is read.
 */
export function pivot(context: any, key: string | undefined, source: any, leftbars: number, rightbars: number, high: boolean): number | undefined {
    if (!key) return pivotAt(Series.from(source).toArray(), context.idx, leftbars, rightbars, high);

    const win = nonNaWindow(context, key, Series.from(source), leftbars + rightbars + 1, 'extremes');
    if (!win || !(rightbars >= 0)) return NaN;
    const bar = high ? win.maxBar() : win.minBar();
    return bar === context.idx - rightbars ? (high ? win.max() : win.min()) : NaN;
}
