// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Building blocks for the rolling windows of the ta functions: each one is updated in O(1)
 * (amortized) or O(log n) per value, so a window function costs the same per bar whatever its length.
 */

/** Values in arrival order; `at(0)` is the newest. O(1) push / shift. */
export class Ring<T = number> {
    private buf: T[];
    private head = 0;
    private mask: number;
    size = 0;

    constructor(capacity = 8) {
        let cap = 8;
        while (cap < capacity) cap *= 2;
        this.buf = new Array(cap);
        this.mask = cap - 1;
    }

    /** A ring holding `newestFirst` (index 0 = newest). */
    static from<T>(newestFirst: T[]): Ring<T> {
        const r = new Ring<T>(newestFirst.length + 1);
        for (let i = newestFirst.length - 1; i >= 0; i--) r.push(newestFirst[i]);
        return r;
    }

    push(v: T): void {
        if (this.size === this.buf.length) this.grow();
        this.buf[(this.head + this.size) & this.mask] = v;
        this.size++;
    }

    /** Removes and returns the oldest value. */
    shift(): T {
        const v = this.buf[this.head];
        this.head = (this.head + 1) & this.mask;
        this.size--;
        return v;
    }

    /** The `i`-th newest value (0 = newest). */
    at(i: number): T {
        return this.buf[(this.head + this.size - 1 - i) & this.mask];
    }

    oldest(): T {
        return this.buf[this.head];
    }

    /** Newest first. */
    toArray(): T[] {
        const out = new Array(this.size);
        for (let i = 0; i < this.size; i++) out[i] = this.at(i);
        return out;
    }

    private grow(): void {
        const n = this.buf.length;
        const buf = new Array(n * 2);
        for (let i = 0; i < this.size; i++) buf[i] = this.buf[(this.head + i) & this.mask];
        this.buf = buf;
        this.head = 0;
        this.mask = n * 2 - 1;
    }
}

/**
 * Monotonic queue of (seq, value) pairs for a rolling maximum (or minimum): the front holds the best
 * value of the queued range and, among equal values, the oldest one.
 */
export class MonoDeque {
    private seqs: number[] = [];
    private vals: number[] = [];
    private head = 0;

    constructor(private readonly max: boolean) {}

    push(seq: number, v: number): void {
        const { seqs, vals } = this;
        while (vals.length > this.head && (this.max ? vals[vals.length - 1] < v : vals[vals.length - 1] > v)) {
            vals.pop();
            seqs.pop();
        }
        seqs.push(seq);
        vals.push(v);
    }

    /** Drops the values pushed with a seq below `from`. */
    expire(from: number): void {
        while (this.head < this.seqs.length && this.seqs[this.head] < from) this.head++;
        if (this.head > 32 && this.head * 2 > this.seqs.length) {
            this.seqs.splice(0, this.head);
            this.vals.splice(0, this.head);
            this.head = 0;
        }
    }

    clear(): void {
        this.seqs.length = 0;
        this.vals.length = 0;
        this.head = 0;
    }

    /** Position of the best entry with seq >= `from`, or -1. Does not modify the queue. */
    first(from: number): number {
        let i = this.head;
        while (i < this.seqs.length && this.seqs[i] < from) i++;
        return i < this.seqs.length ? i : -1;
    }

    seqAt(pos: number): number {
        return this.seqs[pos];
    }

    valAt(pos: number): number {
        return this.vals[pos];
    }
}

/** Number of values of the sorted array `a` that are < `x`. */
export function lowerBound(a: number[], x: number): number {
    let lo = 0;
    let hi = a.length;
    while (lo < hi) {
        const m = (lo + hi) >>> 1;
        if (a[m] < x) lo = m + 1;
        else hi = m;
    }
    return lo;
}

/** Number of values of the sorted array `a` that are <= `x`. */
export function upperBound(a: number[], x: number): number {
    let lo = 0;
    let hi = a.length;
    while (lo < hi) {
        const m = (lo + hi) >>> 1;
        if (a[m] <= x) lo = m + 1;
        else hi = m;
    }
    return lo;
}

export function sortedInsert(a: number[], x: number): void {
    a.splice(upperBound(a, x), 0, x);
}

/** Removes one value equal to `x` (which must be present). */
export function sortedRemove(a: number[], x: number): void {
    a.splice(lowerBound(a, x), 1);
}

/**
 * The `k`-th smallest (0-based) of the sorted array `a` with one value equal to `remove` taken out and
 * `add` put in, without modifying `a`.
 */
export function kthWith(a: number[], k: number, add?: number, remove?: number): number {
    const ri = remove === undefined ? -1 : lowerBound(a, remove);
    const t = (j: number) => a[ri >= 0 && j >= ri ? j + 1 : j];
    if (add === undefined) return t(k);
    let p = lowerBound(a, add);
    if (ri >= 0 && ri < p) p--;
    return k < p ? t(k) : k === p ? add : t(k - 1);
}

/** Count of each value of a window, grouped by count, for its mode in O(log n) per change. */
export class ValueCounts {
    private counts = new Map<number, number>();
    // values having each count, ascending
    private byCount = new Map<number, number[]>();
    private maxCount = 0;

    add(v: number): void {
        const c = this.counts.get(v) || 0;
        if (c > 0) sortedRemove(this.byCount.get(c)!, v);
        this.counts.set(v, c + 1);
        let bucket = this.byCount.get(c + 1);
        if (!bucket) this.byCount.set(c + 1, (bucket = []));
        sortedInsert(bucket, v);
        if (c + 1 > this.maxCount) this.maxCount = c + 1;
    }

    /** Removes one `v` (which must be counted). */
    remove(v: number): void {
        const c = this.counts.get(v)!;
        const bucket = this.byCount.get(c)!;
        sortedRemove(bucket, v);
        if (c > 1) {
            this.counts.set(v, c - 1);
            sortedInsert(this.byCount.get(c - 1)!, v);
        } else {
            this.counts.delete(v);
        }
        if (c === this.maxCount && bucket.length === 0) this.maxCount--;
    }

    /** The most frequent value, the smallest among equally frequent ones; NaN when empty. */
    mode(): number {
        return this.maxCount === 0 ? NaN : this.byCount.get(this.maxCount)![0];
    }
}

/** The current call's change: `x` added (dropping the oldest value when `evict`), or `values` replacing the window. */
interface CallTentative {
    rebuilt: boolean;
    x?: any;
    evict?: boolean;
    values?: any[];
    cap: number;
}

/** Per-function constants (no allocation per call): `src` is the argument passed to `push`. */
export interface PushOptions {
    /** Completes a window short of `cap` values from the source history (newest first). */
    backfill?: (values: any[], win: CallWindow, src: any, cap: number) => void;
    /** Drop at most one value beyond `cap` (the window of a few functions shrinks by one value per call). */
    trimOnce?: boolean;
    /** Called with each value dropped from the window, oldest first, before `backfill`. */
    dropped?: (v: any, win: CallWindow) => void;
}

const NO_OPTIONS: PushOptions = {};

/** Backfill with the source values of the bars behind the window (`src`: the source argument). */
export const BACKFILL_FROM_SOURCE: PushOptions = {
    backfill: (values, _win, src, cap) => {
        const series = Series.from(src);
        while (values.length < cap) values.push(series.get(values.length));
    },
};

/**
 * The values of the last calls of a function (newest first), committed / tentative: the window
 * committed on the previous bar is never copied; the current call's value is kept aside and only added
 * when the next bar starts, so a bar evaluated again (live bar) starts from the same window.
 *
 * `push` adds a value and drops the oldest beyond `cap`. A window still short of `cap` values, on a call
 * made once the function has been called `cap` times or the chart has `cap` bars, is completed by
 * `backfill` (reading the source history): a function called inside an `if` or only on the last bar
 * needs that. Such a call, like one with a `cap` smaller than the window, rebuilds the window
 * (O(cap)); every other call is O(1).
 *
 * With `carry`, the window holds one value per bar rather than per call: a bar on which the function
 * was not called (the call is in a local block that did not run) repeats the value of the last call.
 * That is TradingView's history of `source[i]` inside most ta functions (`ta.wma`, `ta.change`,
 * `ta.stoch`, ...), while others (`ta.sma`, `ta.median`, `math.sum`, ...) only see their calls.
 *
 * Subclasses keep aggregates of the committed values up to date in `pushed` / `rebuilt`; a caller can
 * also carry its own running values in `agg` (committed) / `tAgg` (current call): the two are swapped
 * on commit, so a caller writing every field of `tAgg` on each call allocates nothing.
 */
export class CallWindow {
    lastIdx = -1;
    ring = new Ring<any>();
    calls = 0;
    /** `cap` of the committed window. */
    cap = NaN;
    t: CallTentative | null = null;
    agg: any = undefined;
    tAgg: any = undefined;
    private tCalls = 0;
    private fast: CallTentative = { rebuilt: false, x: undefined, evict: false, cap: NaN };

    constructor(readonly carry = false) {}

    /** Commits the previous bar's call when `idx` starts a new bar. */
    begin(idx: number): void {
        if (idx <= this.lastIdx) return;
        const t = this.t;
        if (t) {
            if (t.rebuilt) {
                this.ring = Ring.from(t.values);
                this.cap = t.cap;
                this.rebuilt();
            } else {
                this.ring.push(t.x);
                const y = t.evict ? this.ring.shift() : undefined;
                const sameCap = this.cap === t.cap;
                this.cap = t.cap;
                this.pushed(t.x, t.evict, y, sameCap);
            }
            this.calls = this.tCalls;
            const agg = this.agg;
            this.agg = this.tAgg;
            this.tAgg = agg;
            this.t = null;
        }
        if (this.carry && this.lastIdx >= 0 && this.ring.size > 0) {
            // the bars skipped since the last call repeat its value (at most a window of them)
            const skipped = Math.min(idx - this.lastIdx - 1, this.cap);
            for (let k = 0; k < skipped; k++) {
                const v = this.ring.at(0);
                this.ring.push(v);
                const evict = this.ring.size > this.cap;
                this.pushed(v, evict, evict ? this.ring.shift() : undefined, true);
            }
        }
        this.lastIdx = idx;
    }

    /** Tentatively adds `x` for the current call, dropping the oldest values beyond `cap`. */
    push(idx: number, x: any, cap: number, opts: PushOptions = NO_OPTIONS, src?: any): void {
        const calls = this.calls + 1;
        this.tCalls = calls;
        const n = this.ring.size;
        const fill = !!opts.backfill && Math.min(n + 1, cap) < cap && (calls >= cap || idx >= cap - 1);
        if (n <= cap && !fill) {
            const evict = n + 1 > cap;
            if (evict && opts.dropped) opts.dropped(this.ring.oldest(), this);
            const t = this.fast;
            t.x = x;
            t.evict = evict;
            t.cap = cap;
            this.t = t;
            return;
        }
        const values = this.ring.toArray();
        values.unshift(x);
        if (opts.trimOnce) {
            if (values.length > cap) {
                const v = values.pop();
                if (opts.dropped) opts.dropped(v, this);
            }
        } else {
            while (values.length > cap) {
                const v = values.pop();
                if (opts.dropped) opts.dropped(v, this);
            }
        }
        if (fill) opts.backfill!(values, this, src, cap);
        this.t = { rebuilt: true, values, cap };
    }

    /** Sets the current call's window to `newestFirst` (a rebuild from the source history). */
    set(newestFirst: any[], cap: number): void {
        this.tCalls = this.calls + 1;
        this.t = { rebuilt: true, values: newestFirst, cap };
    }

    /** Number of values in the current call's window. */
    get size(): number {
        const t = this.t;
        if (!t) return this.ring.size;
        if (t.rebuilt) return t.values.length;
        return this.ring.size + (t.evict ? 0 : 1);
    }

    /** `i`-th newest value of the current call's window. */
    at(i: number): any {
        const t = this.t;
        if (!t) return this.ring.at(i);
        if (t.rebuilt) return t.values[i];
        return i === 0 ? t.x : this.ring.at(i - 1);
    }

    /** The value the current call drops from the committed window (when `t.evict`). */
    evicted(): any {
        return this.ring.oldest();
    }

    private scratch: any[] = [];
    /**
     * The first `n` values (newest first) of the current call's window, in an array reused by every
     * call: for functions that loop over the whole window.
     */
    values(n: number): any[] {
        const t = this.t;
        if (t && t.rebuilt) return t.values!;
        const out = this.scratch;
        out.length = n;
        let i = 0;
        if (t) out[i++] = t.x;
        const ring = this.ring;
        for (let k = 0; i < n; i++, k++) out[i] = ring.at(k);
        return out;
    }

    /** `x` was added (and `y` dropped when `evict`); `sameCap`: the committed `cap` did not change. */
    protected pushed(_x: any, _evict: boolean, _y: any, _sameCap: boolean): void {}
    /** The ring was replaced. */
    protected rebuilt(): void {}
}

const nanLike = (v: any) => isNaN(v);

/**
 * Rolling maximum / minimum over a CallWindow, where (as on TradingView) only the values since the
 * most recent na take part and an na current value gives na.
 */
export class ExtremeWindow extends CallWindow {
    private seq = 0;
    private dq: MonoDeque;

    constructor(
        private readonly max: boolean,
        carry = false,
    ) {
        super(carry);
        this.dq = new MonoDeque(max);
    }

    protected pushed(x: any): void {
        this.seq++;
        if (nanLike(x)) this.dq.clear();
        else this.dq.push(this.seq, x);
        this.dq.expire(this.seq - this.ring.size + 1);
    }

    protected rebuilt(): void {
        this.dq.clear();
        for (let i = this.ring.size - 1; i >= 0; i--) {
            const v = this.ring.at(i);
            this.seq++;
            if (nanLike(v)) this.dq.clear();
            else this.dq.push(this.seq, v);
        }
    }

    /** Extreme of the first `count` values (newest first) of the current call's window, NaN at an na current value. */
    extreme(count = this.size): number {
        const t = this.t!;
        if (t.rebuilt || count !== this.size) {
            let best = NaN;
            for (let i = 0; i < count; i++) {
                const v = this.at(i);
                if (nanLike(v)) break;
                if (Number.isNaN(best) || (this.max ? v > best : v < best)) best = v;
            }
            return best;
        }
        if (nanLike(t.x)) return NaN;
        // the committed values still in the window have seq > this.seq - (size - 1)
        const p = this.dq.first(this.seq - this.size + 2);
        if (p < 0) return t.x;
        const v = this.dq.valAt(p);
        return this.max ? (v > t.x ? v : t.x) : v < t.x ? v : t.x;
    }
}

/**
 * A CallWindow of `cap` values with their sum S and weighted sum N (newest weight `cap`, oldest 1).
 * Once the window is full they move in O(1) per value: S' = S - y + x, N' = N - S + cap * x. They are
 * summed afresh every `cap` values (bounding the float drift) and when the window becomes full or an
 * na leaves it.
 */
export class WeightedWindow extends CallWindow {
    nan = 0;
    S = 0;
    N = 0;
    ok = false;
    private steps = 0;

    protected pushed(x: any, evict: boolean, y: any, sameCap: boolean): void {
        if (Number.isNaN(x)) this.nan++;
        if (evict && Number.isNaN(y)) this.nan--;
        if (this.ok && evict && sameCap && this.nan === 0 && ++this.steps < this.cap) {
            this.N = this.N - this.S + this.cap * x;
            this.S = this.S - y + x;
        } else {
            this.resum();
        }
    }

    protected rebuilt(): void {
        this.nan = 0;
        for (let i = 0; i < this.ring.size; i++) if (Number.isNaN(this.ring.at(i))) this.nan++;
        this.resum();
    }

    private resum(): void {
        this.steps = 0;
        this.ok = false;
        if (this.ring.size !== this.cap || this.nan > 0) return;
        let S = 0;
        let N = 0;
        for (let i = 0; i < this.cap; i++) {
            const v = this.ring.at(i);
            N += v * (this.cap - i);
            S += v;
        }
        this.S = S;
        this.N = N;
        this.ok = true;
    }

    /** [S, N] of the current call's window when it holds `t.cap` values and no na; otherwise undefined. */
    sums(): [number, number] | undefined {
        const t = this.t!;
        const size = this.size;
        if (size !== t.cap) return undefined;
        if (!t.rebuilt && t.evict && this.ok && this.cap === t.cap) {
            if (Number.isNaN(t.x) || Number.isNaN(this.evicted())) return undefined;
            return [this.S - this.evicted() + t.x, this.N - this.S + t.cap * t.x];
        }
        let S = 0;
        let N = 0;
        for (let i = 0; i < size; i++) {
            const v = this.at(i);
            if (Number.isNaN(v)) return undefined;
            N += v * (t.cap - i);
            S += v;
        }
        return [S, N];
    }
}

/** A CallWindow whose values (all but na, as `isNa` decides) are also kept sorted. */
export class SortedWindow extends CallWindow {
    sorted: number[] = [];
    nan = 0;

    constructor(
        private readonly isNa: (v: any) => boolean,
        carry = false,
    ) {
        super(carry);
    }

    protected pushed(x: any, evict: boolean, y: any): void {
        if (this.isNa(x)) this.nan++;
        else sortedInsert(this.sorted, x);
        if (evict) {
            if (this.isNa(y)) this.nan--;
            else sortedRemove(this.sorted, y);
        }
    }

    protected rebuilt(): void {
        this.nan = 0;
        this.sorted = [];
        for (let i = 0; i < this.ring.size; i++) {
            const v = this.ring.at(i);
            if (this.isNa(v)) this.nan++;
            else this.sorted.push(v);
        }
        this.sorted.sort((a, b) => a - b);
    }

    private tSorted: number[] | null = null;
    private tSortedFor: any = null;
    // the current call's values (all but na) in order, for a rebuilt window
    private rebuiltSorted(): number[] {
        const t = this.t!;
        if (this.tSortedFor !== t.values) {
            this.tSorted = t.values!.filter((v) => !this.isNa(v)).sort((a, b) => a - b);
            this.tSortedFor = t.values;
        }
        return this.tSorted!;
    }

    /** Number of na values in the current call's window. */
    nas(): number {
        const t = this.t!;
        if (t.rebuilt) return t.values!.length - this.rebuiltSorted().length;
        return this.nan + (this.isNa(t.x) ? 1 : 0) - (t.evict && this.isNa(this.evicted()) ? 1 : 0);
    }

    /** `k`-th smallest (0-based) non-na value of the current call's window. */
    kth(k: number): number {
        const t = this.t!;
        if (t.rebuilt) return this.rebuiltSorted()[k];
        const y = t.evict ? this.evicted() : undefined;
        return kthWith(this.sorted, k, this.isNa(t.x) ? undefined : t.x, y === undefined || this.isNa(y) ? undefined : y);
    }

    /** Number of non-na values <= `v` in the current call's window without its newest value. */
    countPrevLE(v: number): number {
        const t = this.t!;
        if (t.rebuilt) {
            let n = 0;
            for (let i = 1; i < t.values!.length; i++) {
                const w = t.values![i];
                if (!this.isNa(w) && w <= v) n++;
            }
            return n;
        }
        const y = t.evict ? this.evicted() : undefined;
        return upperBound(this.sorted, v) - (y !== undefined && !this.isNa(y) && y <= v ? 1 : 0);
    }
}
