// SPDX-License-Identifier: AGPL-3.0-only

import { CountsTail, ExtremeTail, History, SortedTail } from './history';
import { chargeTaMemory, chargeTaWork, validTaLength } from './assertTaLength';
import type { ExecutionBudget } from '../../../security/ExecutionBudget';

export const isNa = (v: any): boolean => v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v));

/** The window of one call: `length` values, newest first, their sum and (when kept) their order. */
export interface NonNaView {
    sum: number;
    /** `i`-th newest value. */
    at(i: number): number;
    /** The `length` values, newest first (an array reused by the next call). */
    values(): number[];
    /** `k`-th smallest value (0-based); only for a window created with `'sorted'`. */
    kth(k: number): number;
    /** Most frequent value, the smallest among equally frequent ones; only for `'counts'`. */
    mode(): number;
    /** Largest / smallest value (the newest among equal ones); only for `'extremes'`. */
    max(): number;
    min(): number;
    /** Bar index of that value. */
    maxBar(): number;
    minBar(): number;
}

/** What a window keeps besides its values and sum. */
export type Track = 'sorted' | 'counts' | 'extremes' | false;

/**
 * When a window has a value: `'values'` once `length` non-na values have been seen; `'bars'` from
 * bar_index `length - 1` on, over the non-na values seen so far when there are fewer than `length`
 * (none: no value).
 */
export type Gate = 'values' | 'bars';

/** The source of a window: a series, or a function of the offset (0 = current bar). */
export type ValueSource = { get(k: number): any } | ((k: number) => number);

const read = (src: ValueSource, k: number): number => (typeof src === 'function' ? src(k) : src.get(k));

// bars read back for the first call's backfill (beyond the window itself)
const BACKFILL_BARS = 5000;

class NonNaState implements NonNaView {
    h: History;
    lastIdx = -1;
    savedEnd = 0;
    sorted: SortedTail | null;
    counts: CountsTail | null;
    hi: ExtremeTail | null;
    lo: ExtremeTail | null;
    // bar index of each value (with `'extremes'`)
    bars: History | null;
    length = 0;
    reservedLength = 0;
    sum = NaN;

    constructor(track: Track, private readonly budget?: ExecutionBudget) {
        this.h = new History(1, budget);
        this.sorted = track === 'sorted' ? new SortedTail(budget) : null;
        this.counts = track === 'counts' ? new CountsTail(budget) : null;
        this.hi = track === 'extremes' ? new ExtremeTail(true, true, budget) : null;
        this.lo = track === 'extremes' ? new ExtremeTail(false, true, budget) : null;
        this.bars = track === 'extremes' ? new History(0, budget) : null;
    }

    push(v: number, bar: number): void {
        this.h.push(v);
        this.bars?.push(bar);
    }

    max(): number {
        return this.h.get(this.hi!.find(this.h, this.length));
    }

    min(): number {
        return this.h.get(this.lo!.find(this.h, this.length));
    }

    maxBar(): number {
        return this.bars!.get(this.hi!.find(this.h, this.length));
    }

    minBar(): number {
        return this.bars!.get(this.lo!.find(this.h, this.length));
    }

    at(i: number): number {
        return this.h.at(i);
    }

    private scratch: number[] = [];
    values(): number[] {
        const n = this.length;
        this.budget?.chargeWork(n, 'ta.window');
        const out = this.scratch;
        out.length = n;
        const v = this.h.view(n);
        for (let i = 0; i < n; i++) out[i] = v[n - 1 - i];
        return out;
    }

    kth(k: number): number {
        return this.sorted!.sorted[k];
    }

    mode(): number {
        return this.counts!.counts.mode();
    }
}

/**
 * The last `length` non-na values of a source, newest first, and their sum: the window TradingView's
 * `ta.sma`, `ta.variance`, `ta.stdev`, `ta.median`, `ta.vwma` and `ta.correlation` use. An na value is
 * skipped, not counted, so a bar whose value is na leaves the window as it was. `undefined` while
 * fewer than `length` non-na values have been seen. With `gate = 'bars'` (TradingView's ta.highest,
 * ta.lowest, *bars, ta.stoch, ta.wpr and the pivots) the window instead has a value from bar_index
 * `length - 1` on, holding the fewer non-na values seen until then (`length` of the view is their count).
 *
 * In a local block the values are those of the calls, as on TradingView; `length` may change from call
 * to call (a series length), the window then reaching further back into the earlier calls. The values
 * before the first call are read from the source (PineTS's backfill, for a function first called on a
 * later bar, e.g. on the last bar only).
 *
 * `valueAt` reads the source `k` bars back (0 = current): a series or a function; `current`, when given,
 * is the current value (`valueAt` is then only read for the backfill). State lives in
 * `context.taState[key]`; a bar evaluated again (live bar) starts from the values of the previous bars.
 *
 * The values are kept with prefix sums (History), so the sum of any window costs O(1); `'sorted'` /
 * `'counts'` keep the window ordered / counted, O(log length) a value; `'extremes'` its maximum and
 * minimum (and their bars), O(log length) a query.
 */
export function nonNaWindow(
    context: any,
    key: string,
    valueAt: ValueSource,
    length: number,
    track: Track = false,
    current?: number,
    gate: Gate = 'values',
): NonNaView | undefined {
    if (!validTaLength(length, 'ta.window')) return undefined;
    if (!context.taState) context.taState = {};
    let s: NonNaState = context.taState[key];
    const reserved = s?.reservedLength ?? 0;
    if (length > reserved) {
        // History prefixes, optional sorted/extreme indexes and rollback logs retain storage.
        chargeTaMemory(context, 100 * (length - reserved), 'ta.window');
    }
    if (!s) s = context.taState[key] = new NonNaState(track, context.executionBudget);
    s.reservedLength = Math.max(reserved, length);
    const h = s.h;
    h.keepFor(length);
    s.bars?.keepFor(length);

    if (context.idx !== s.lastIdx) {
        if (s.lastIdx < 0) {
            chargeTaWork(context, Math.min(context.idx, BACKFILL_BARS + 2 * length), 'ta.window');
            for (let k = Math.min(context.idx, BACKFILL_BARS + 2 * length); k >= 1; k--) {
                const v = read(valueAt, k);
                if (!isNa(v)) s.push(v, context.idx - k);
            }
        } else {
            h.compact();
            s.bars?.compact();
        }
        s.savedEnd = h.end;
        s.sorted?.commit();
        s.counts?.commit();
        s.hi?.commit(h);
        s.lo?.commit(h);
        s.lastIdx = context.idx;
    } else {
        h.truncate(s.savedEnd);
        s.bars?.truncate(s.savedEnd);
        s.sorted?.rollback();
        s.counts?.rollback();
        s.hi?.rollback();
        s.lo?.rollback();
    }

    const value = current === undefined ? read(valueAt, 0) : current;
    if (!isNa(value)) s.push(value, context.idx);
    s.hi?.sync(h);
    s.lo?.sync(h);

    let n = length;
    if (gate === 'bars') {
        if (context.idx < length - 1 || h.size === 0) return undefined;
        n = Math.min(length, h.size);
    } else if (h.size < length) return undefined;
    s.sorted?.sync(h, n);
    s.counts?.sync(h, n);
    s.length = n;
    s.sum = h.sum(n);
    return s;
}
