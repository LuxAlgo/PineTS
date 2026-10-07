// SPDX-License-Identifier: AGPL-3.0-only

import { Ring, ValueCounts, kthWith, sortedInsert, sortedRemove } from './windows';

export const isNa = (v: any): boolean => v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v));

type Entry = { v: number; n: number };

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
}

/** What a window keeps besides its values and sum. */
export type Track = 'sorted' | 'counts' | false;

type Tentative =
    | { kind: 'push'; v: number | undefined; evict: boolean; sum: number; calls: number; callIdx: number; exhausted: boolean; length: number }
    | { kind: 'rebuild'; entries: Entry[]; sum: number; calls: number; callIdx: number; exhausted: boolean; length: number };

class NonNaState implements NonNaView {
    lastIdx = -1;
    // Committed window (as of the previous bar the function was called on)
    vals = new Ring<number>();
    ns = new Ring<number>();
    sorted: number[] | null;
    counts: ValueCounts | null;
    total = 0;
    calls = 0;
    callIdx = -1;
    exhausted = false;
    length = NaN;
    // Tentative change of the current bar
    t: Tentative | null = null;
    tSorted: number[] | null = null;
    // the tentative change of a plain push, reused by every call
    fast: Extract<Tentative, { kind: 'push' }> = { kind: 'push', v: undefined, evict: false, sum: 0, calls: 0, callIdx: -1, exhausted: false, length: NaN };

    constructor(track: Track) {
        this.sorted = track === 'sorted' ? [] : null;
        this.counts = track === 'counts' ? new ValueCounts() : null;
    }

    get sum(): number {
        return this.t!.sum;
    }

    at(i: number): number {
        const t = this.t!;
        if (t.kind === 'rebuild') return t.entries[i].v;
        if (t.v === undefined) return this.vals.at(i);
        return i === 0 ? t.v : this.vals.at(i - 1);
    }

    private scratch: number[] = [];
    values(): number[] {
        const t = this.t!;
        const n = t.length;
        if (t.kind === 'rebuild') return t.entries.map((e) => e.v);
        const out = this.scratch;
        out.length = n;
        let i = 0;
        if (t.v !== undefined) out[i++] = t.v;
        for (let k = 0; i < n; i++, k++) out[i] = this.vals.at(k);
        return out;
    }

    kth(k: number): number {
        const t = this.t!;
        if (t.kind === 'rebuild') {
            if (!this.tSorted) this.tSorted = t.entries.map((e) => e.v).sort((a, b) => a - b);
            return this.tSorted[k];
        }
        return kthWith(this.sorted!, k, t.v, t.evict ? this.vals.oldest() : undefined);
    }

    mode(): number {
        const t = this.t!;
        if (t.kind === 'rebuild') {
            const counts = new ValueCounts();
            for (const e of t.entries) counts.add(e.v);
            return counts.mode();
        }
        // the committed counts with the current call's change applied, then restored
        const counts = this.counts!;
        const y = t.evict ? this.vals.oldest() : undefined;
        if (t.v !== undefined) counts.add(t.v);
        if (y !== undefined) counts.remove(y);
        const mode = counts.mode();
        if (y !== undefined) counts.add(y);
        if (t.v !== undefined) counts.remove(t.v);
        return mode;
    }

    commit(): void {
        const t = this.t;
        if (!t) return;
        if (t.kind === 'push') {
            if (t.v !== undefined) {
                this.vals.push(t.v);
                this.ns.push(t.calls);
                if (this.sorted) sortedInsert(this.sorted, t.v);
                if (this.counts) this.counts.add(t.v);
            }
            if (t.evict) {
                const old = this.vals.shift();
                this.ns.shift();
                if (this.sorted) sortedRemove(this.sorted, old);
                if (this.counts) this.counts.remove(old);
            }
        } else {
            this.vals = Ring.from(t.entries.map((e) => e.v));
            this.ns = Ring.from(t.entries.map((e) => e.n));
            if (this.sorted) this.sorted = this.tSorted ?? t.entries.map((e) => e.v).sort((a, b) => a - b);
            if (this.counts) {
                this.counts = new ValueCounts();
                for (const e of t.entries) this.counts.add(e.v);
            }
        }
        this.total = t.sum;
        this.calls = t.calls;
        this.callIdx = t.callIdx;
        this.exhausted = t.exhausted;
        this.length = t.length;
        this.t = null;
        this.tSorted = null;
    }
}

/**
 * The last `length` non-na values of a source, newest first, and their sum: the window TradingView's
 * `ta.sma`, `ta.variance`, `ta.stdev`, `ta.median`, `ta.vwma` and `ta.correlation` use. An na value is
 * skipped, not counted, so a bar whose value is na leaves the window as it was. `undefined` while
 * fewer than `length` non-na values have been seen.
 *
 * `valueAt` reads the source `k` bars back (0 = current): a series or a function; `current`, when given,
 * is the current value (`valueAt` is then only read for a backfill). State lives in `context.taState[key]`:
 * the window committed on the previous bar plus the change of the current call, so a bar evaluated
 * again (live bar) starts from the same committed window. Each value keeps the number of the call it
 * was read on, so a call made after skipped bars (the function called inside an `if`) backfills from
 * the source right behind the oldest value it holds. Once a backfill has reached the first bar, calls
 * on consecutive bars do not scan the history again (a long na stretch would make that quadratic).
 *
 * A call that only adds a value (and drops the oldest) costs O(1), O(log length) with `'sorted'` or
 * `'counts'`; a backfill or a change of `length` rebuilds the window.
 */
/** The source of a window: a series, or a function of the offset (0 = current bar). */
export type ValueSource = { get(k: number): any } | ((k: number) => number);

const read = (src: ValueSource, k: number): number => (typeof src === 'function' ? src(k) : src.get(k));

export function nonNaWindow(
    context: any,
    key: string,
    valueAt: ValueSource,
    length: number,
    track: Track = false,
    current?: number
): NonNaView | undefined {
    if (!context.taState) context.taState = {};
    let s: NonNaState = context.taState[key];
    if (!s) s = context.taState[key] = new NonNaState(track);
    if (context.idx > s.lastIdx) {
        s.commit();
        s.lastIdx = context.idx;
    }
    s.t = null;
    s.tSorted = null;

    const calls = s.calls + 1;
    let exhausted = s.exhausted && s.callIdx === context.idx - 1 && s.length === length;
    const value = current === undefined ? read(valueAt, 0) : current;
    const push = !isNa(value);
    const size = Math.min(s.vals.size + (push ? 1 : 0), length);
    const backfill = size < length && !exhausted && (calls >= length || context.idx >= length - 1);

    if (s.length === length && !backfill) {
        let sum = s.total;
        let evict = false;
        if (push) {
            sum += value;
            if (s.vals.size + 1 > length) {
                sum -= s.vals.oldest();
                evict = true;
            }
        }
        const t = s.fast;
        t.v = push ? value : undefined;
        t.evict = evict;
        t.sum = sum;
        t.calls = calls;
        t.callIdx = context.idx;
        t.exhausted = exhausted;
        t.length = length;
        s.t = t;
        return size < length ? undefined : s;
    }

    const entries: Entry[] = [];
    for (let i = 0; i < s.vals.size; i++) entries.push({ v: s.vals.at(i), n: s.ns.at(i) });
    let sum = s.total;
    if (push) {
        entries.unshift({ v: value, n: calls });
        sum += value;
    }
    while (entries.length > length) sum -= entries.pop()!.v;

    let rebuilt = s.length !== length;
    if (entries.length < length && !exhausted && (calls >= length || context.idx >= length - 1)) {
        let k = entries.length ? calls - entries[entries.length - 1].n + 1 : 1;
        for (; entries.length < length && k <= context.idx; k++) {
            const v = read(valueAt, k);
            if (!isNa(v)) entries.push({ v, n: calls - k });
        }
        exhausted = entries.length < length;
        rebuilt = true;
    }
    if (rebuilt) sum = entries.reduce((acc, e) => acc + e.v, 0);

    s.t = { kind: 'rebuild', entries, sum, calls, callIdx: context.idx, exhausted, length };
    return entries.length < length ? undefined : s;
}
