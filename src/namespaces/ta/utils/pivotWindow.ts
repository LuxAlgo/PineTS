// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { BACKFILL_FROM_SOURCE, CallWindow } from './windows';
import { pivothighAt } from './pivothigh';
import { pivotlowAt } from './pivotlow';

/**
 * Pivot high (low) confirmed on the current bar. With a key the last `leftbars + rightbars + 1` values
 * are kept in a window where, as on TradingView, a bar on which the call did not run (local block)
 * repeats the last call's value; without one the source series is read.
 */
export function pivot(context: any, key: string | undefined, source: any, leftbars: number, rightbars: number, high: boolean): number | undefined {
    const at = high ? pivothighAt : pivotlowAt;
    if (!key) return at(Series.from(source).toArray(), context.idx, leftbars, rightbars);

    const cap = leftbars + rightbars + 1;
    if (!context.taState) context.taState = {};
    const win: CallWindow = (context.taState[key] ??= new CallWindow(true));
    win.begin(context.idx);
    win.push(context.idx, Series.from(source).get(0), cap, BACKFILL_FROM_SOURCE, source);
    if (win.size < cap) return NaN;

    // the window oldest first, the current bar at index cap - 1
    const values = win.values(cap);
    const oldestFirst: number[] = new Array(cap);
    for (let i = 0; i < cap; i++) oldestFirst[i] = values[cap - 1 - i];
    return at(oldestFirst, cap - 1, leftbars, rightbars);
}
