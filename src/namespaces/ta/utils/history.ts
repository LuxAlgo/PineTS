// SPDX-License-Identifier: AGPL-3.0-only

import { lowerBound, upperBound, ValueCounts } from './windows';
import { assertTaLength, MAX_TA_LENGTH } from './assertTaLength';
import { PineRuntimeError } from '../../../errors/PineRuntimeError';
import type { ExecutionBudget } from '../../../security/ExecutionBudget';

/**
 * Lookback kept by a History: TradingView's history buffers go up to 5000 bars; a longer window keeps
 * twice its length.
 */
const MIN_KEEP = 5000;

const isNa = (v: number) => Number.isNaN(v);

// Double-double arithmetic: a value is hi + lo with |lo| <= ulp(hi) / 2
const SPLIT = 134217729; // 2^27 + 1
function twoProdHi(a: number, b: number): number {
    return a * b;
}
function twoProdLo(a: number, b: number, p: number): number {
    let t = SPLIT * a;
    const ah = t - (t - a);
    const al = a - ah;
    t = SPLIT * b;
    const bh = t - (t - b);
    const bl = b - bh;
    return ah * bh - p + ah * bl + al * bh + al * bl;
}

/**
 * Values in order (oldest first) with exact window sums: prefix sums of x (and of j * x, j the entry
 * number) kept in double-double, so the sum of any number of newest values costs O(1) and is as
 * accurate as summing them one by one. An na value counts 0 in the sums and is counted apart.
 *
 * Entries are numbered from the first push (`start` to `end`); the oldest beyond the lookback kept
 * (`keepFor`) are dropped by `compact`, called only between bars so that a bar evaluated again can
 * `truncate` back to where it started.
 */
export class History {
    private v = new Float64Array(64);
    private nan = new Int32Array(65);
    private ph: Float64Array | null;
    private pl: Float64Array | null;
    private qh: Float64Array | null;
    private ql: Float64Array | null;
    /** Physical index of entry `start`. */
    private off = 0;
    start = 0;
    end = 0;
    private keep = MIN_KEEP;

    constructor(sums: 0 | 1 | 2 = 0, private readonly budget?: ExecutionBudget) {
        budget?.chargeMemory(64 * 8 + 65 * 4 + sums * 2 * 65 * 8, 'ta.history');
        this.ph = sums >= 1 ? new Float64Array(65) : null;
        this.pl = sums >= 1 ? new Float64Array(65) : null;
        this.qh = sums >= 2 ? new Float64Array(65) : null;
        this.ql = sums >= 2 ? new Float64Array(65) : null;
    }

    get size(): number {
        return this.end - this.start;
    }

    /** Keeps at least `n` entries (and the default lookback). */
    keepFor(n: number): void {
        // CarryHistory reserves one extra slot for the value leaving the public window.
        if (!Number.isSafeInteger(n) || n < 1 || n > MAX_TA_LENGTH + 1) {
            throw new PineRuntimeError(`TA history span exceeds ${MAX_TA_LENGTH + 1}.`, 'ta.history');
        }
        if (2 * n > this.keep) this.keep = 2 * n;
    }

    private grow(): void {
        const cap = this.v.length * 2;
        const channels = 1 + (this.ph ? 2 : 0) + (this.qh ? 2 : 0);
        this.budget?.chargeMemory(cap * 8 * channels + (cap + 1) * 4, 'ta.history');
        const re = (a: Float64Array, n: number) => {
            const b = new Float64Array(n);
            b.set(a);
            return b;
        };
        this.v = re(this.v, cap);
        const nan = new Int32Array(cap + 1);
        nan.set(this.nan);
        this.nan = nan;
        if (this.ph) {
            this.ph = re(this.ph, cap + 1);
            this.pl = re(this.pl!, cap + 1);
        }
        if (this.qh) {
            this.qh = re(this.qh, cap + 1);
            this.ql = re(this.ql!, cap + 1);
        }
    }

    push(x: number): void {
        let p = this.off + this.end - this.start;
        if (p >= this.v.length) {
            this.grow();
            p = this.off + this.end - this.start;
        }
        this.v[p] = x;
        const na = isNa(x);
        this.nan[p + 1] = this.nan[p] + (na ? 1 : 0);
        const y = na ? 0 : x;
        if (this.ph) {
            // (ph, pl)[p + 1] = (ph, pl)[p] + y
            const a = this.ph[p];
            const s = a + y;
            const bb = s - a;
            const e = a - (s - bb) + (y - bb) + this.pl![p];
            const hi = s + e;
            this.ph[p + 1] = hi;
            this.pl![p + 1] = e - (hi - s);
        }
        if (this.qh) {
            const j = this.end;
            const ph = twoProdHi(j, y);
            const pe = twoProdLo(j, y, ph);
            const a = this.qh[p];
            const s = a + ph;
            const bb = s - a;
            const e = a - (s - bb) + (ph - bb) + pe + this.ql![p];
            const hi = s + e;
            this.qh[p + 1] = hi;
            this.ql![p + 1] = e - (hi - s);
        }
        this.end++;
    }

    /** Drops the entries pushed after the first `end`. */
    truncate(end: number): void {
        this.end = end;
    }

    /** Drops the entries older than the lookback kept. */
    compact(): void {
        const drop = this.size - this.keep;
        if (drop <= 0 || this.off + this.size < this.v.length * 0.75) return;
        const n = this.size - drop;
        const from = this.off + drop;
        this.v.copyWithin(0, from, from + n);
        this.nan.copyWithin(0, from, from + n + 1);
        if (this.ph) {
            this.ph.copyWithin(0, from, from + n + 1);
            this.pl!.copyWithin(0, from, from + n + 1);
        }
        if (this.qh) {
            this.qh.copyWithin(0, from, from + n + 1);
            this.ql!.copyWithin(0, from, from + n + 1);
        }
        this.off = 0;
        this.start += drop;
    }

    /** Entry number `j` (start <= j < end). */
    get(j: number): number {
        return this.v[this.off + j - this.start];
    }

    /** `i`-th newest entry (0 = newest), NaN beyond the entries kept. */
    at(i: number): number {
        const j = this.end - 1 - i;
        return j >= this.start ? this.v[this.off + j - this.start] : NaN;
    }

    /** The newest `n` entries, oldest first (a view, valid until the next push). */
    view(n: number): Float64Array {
        const p = this.off + this.end - this.start;
        return this.v.subarray(p - n, p);
    }

    /** Number of na among the newest `n` entries. */
    nas(n: number): number {
        const p = this.off + this.end - this.start;
        return this.nan[p] - this.nan[p - n];
    }

    // (hi, lo) of prefix[p] - prefix[p - n] for one channel
    private diff(h: Float64Array, l: Float64Array, n: number): [number, number] {
        const p = this.off + this.end - this.start;
        const a = h[p];
        const b = -h[p - n];
        const s = a + b;
        const bb = s - a;
        const e = a - (s - bb) + (b - bb) + (l[p] - l[p - n]);
        const hi = s + e;
        return [hi, e - (hi - s)];
    }

    /** Sum of the newest `n` entries (na counted 0). */
    sum(n: number): number {
        const [hi, lo] = this.diff(this.ph!, this.pl!, n);
        return hi + lo;
    }

    /** Σ (n - i) * at(i) for i < n: the newest entry weighs n, the oldest 1 (na counted 0). */
    wsum(n: number): number {
        // Σ_j (j - c) x_j over the window, c = end - n - 1: Q - c * P
        const [qh, ql] = this.diff(this.qh!, this.ql!, n);
        const [sh, sl] = this.diff(this.ph!, this.pl!, n);
        const c = this.end - n - 1;
        const ph = c * sh;
        const pe = twoProdLo(c, sh, ph) + c * sl;
        const b = -ph;
        const s = qh + b;
        const bb = s - qh;
        const e = qh - (s - bb) + (b - bb) + (ql - pe);
        return s + e;
    }
}

/** Undo log entry of a tracker: an add (true) or a removal (false) of a value. */
type Op = [boolean, number];

/**
 * A multiset of the newest `n` entries of a History (`n` may change from call to call), kept sorted
 * or counted. `sync` brings it to the current window; `commit` (a new bar) / `rollback` (the same bar
 * computed again) bound the changes of one bar.
 */
abstract class TailTracker {
    /** The tracked window: entries lo .. hi - 1. */
    lo = 0;
    hi = 0;
    private savedLo = 0;
    private savedHi = 0;
    private log: Op[] = [];

    constructor(protected readonly budget?: ExecutionBudget) {}

    protected abstract add(v: number): void;
    protected abstract remove(v: number): void;

    commit(): void {
        this.log.length = 0;
        this.savedLo = this.lo;
        this.savedHi = this.hi;
    }

    rollback(): void {
        for (let i = this.log.length - 1; i >= 0; i--) {
            this.budget?.chargeWork(1, 'ta.window');
            const [added, v] = this.log[i];
            if (added) this.remove(v);
            else this.add(v);
        }
        this.log.length = 0;
        this.lo = this.savedLo;
        this.hi = this.savedHi;
    }

    private doAdd(v: number): void {
        if (isNa(v)) return;
        this.budget?.chargeWork(1, 'ta.window');
        this.add(v);
        this.log.push([true, v]);
    }

    private doRemove(v: number): void {
        if (isNa(v)) return;
        this.budget?.chargeWork(1, 'ta.window');
        this.remove(v);
        this.log.push([false, v]);
    }

    /** Tracks the `n` entries before the newest `skip` ones (fewer if the history is shorter). */
    sync(h: History, n: number, skip = 0): void {
        const hi = h.end - skip;
        const lo = Math.max(h.start, hi - n);
        // entries no longer in the window, then the new ones
        if (lo >= this.hi || hi <= this.lo) {
            while (this.lo < this.hi) this.doRemove(h.get(this.lo++));
            this.lo = this.hi = lo;
        }
        while (this.hi > hi) this.doRemove(h.get(--this.hi));
        while (this.lo < lo) this.doRemove(h.get(this.lo++));
        while (this.hi < hi) this.doAdd(h.get(this.hi++));
        while (this.lo > lo) this.doAdd(h.get(--this.lo));
    }
}

export class SortedTail extends TailTracker {
    sorted: number[] = [];
    protected add(v: number): void {
        const at = upperBound(this.sorted, v);
        this.budget?.chargeWork(this.sorted.length - at + 1, 'ta.sortedWindow');
        this.sorted.splice(at, 0, v);
    }
    protected remove(v: number): void {
        const at = lowerBound(this.sorted, v);
        this.budget?.chargeWork(this.sorted.length - at, 'ta.sortedWindow');
        this.sorted.splice(at, 1);
    }
}

export class CountsTail extends TailTracker {
    counts: ValueCounts;
    constructor(budget?: ExecutionBudget) {
        super(budget);
        this.counts = new ValueCounts(budget);
    }
    protected add(v: number): void {
        this.counts.add(v);
    }
    protected remove(v: number): void {
        this.counts.remove(v);
    }
}

/**
 * Maximum (minimum) of the newest `n` entries of a History, for any `n`: the entries greater (smaller)
 * than every later one, oldest first, so the extreme of a window is the first of them inside it (the
 * oldest among equal values, or with `newest` the newest). Only the entries after the most recent na
 * take part. O(log n) a query, O(1) amortized a push; `commit` / `rollback` as for the trackers.
 */
export class ExtremeTail {
    private idx: number[] = [];
    private val: number[] = [];
    private head = 0;
    /** Entry number of the most recent na (-1: none). */
    lastNa = -1;
    private synced = 0;
    // undo of the current bar: entries popped (in order) and pushed since commit
    private popped: [number, number][] = [];
    private pushedCount = 0;
    private saved = { head: 0, lastNa: -1, synced: 0 };

    constructor(
        private readonly max: boolean,
        private readonly newest = false,
        private readonly budget?: ExecutionBudget,
    ) {}

    commit(h: History): void {
        // drop the entries no longer kept by the history
        while (this.head < this.idx.length && this.idx[this.head] < h.start) this.head++;
        if (this.head > 1024 && this.head * 2 > this.idx.length) {
            this.budget?.chargeWork(this.idx.length + this.val.length, 'ta.extremeWindow');
            this.idx.splice(0, this.head);
            this.val.splice(0, this.head);
            this.head = 0;
        }
        this.popped.length = 0;
        this.pushedCount = 0;
        this.saved = { head: this.head, lastNa: this.lastNa, synced: this.synced };
    }

    rollback(): void {
        this.budget?.chargeWork(this.popped.length + this.pushedCount, 'ta.extremeWindow');
        this.idx.length -= this.pushedCount;
        this.val.length -= this.pushedCount;
        for (let i = this.popped.length - 1; i >= 0; i--) {
            this.idx.push(this.popped[i][0]);
            this.val.push(this.popped[i][1]);
        }
        this.popped.length = 0;
        this.pushedCount = 0;
        this.head = this.saved.head;
        this.lastNa = this.saved.lastNa;
        this.synced = this.saved.synced;
    }

    /** Adds the entries pushed to `h` since the last sync. */
    sync(h: History): void {
        if (this.synced < h.start) this.synced = h.start;
        for (; this.synced < h.end; this.synced++) {
            this.budget?.chargeWork(1, 'ta.extremeWindow');
            const j = this.synced;
            const v = h.get(j);
            if (isNa(v)) {
                this.lastNa = j;
                continue;
            }
            while (this.idx.length > this.head) {
                this.budget?.chargeWork(1, 'ta.extremeWindow');
                const w = this.val[this.val.length - 1];
                if (!(this.max ? w < v || (this.newest && w === v) : w > v || (this.newest && w === v))) break;
                if (this.pushedCount > 0) {
                    this.pushedCount--;
                } else this.popped.push([this.idx[this.idx.length - 1], w]);
                this.idx.pop();
                this.val.pop();
            }
            this.idx.push(j);
            this.val.push(v);
            this.pushedCount++;
        }
    }

    /** Entry number of the extreme of the newest `n` entries of `h` (after the last na), -1 if none. */
    find(h: History, n: number): number {
        const from = Math.max(h.end - n, this.lastNa + 1, h.start);
        // first queued entry >= from
        let lo = this.head;
        let hi = this.idx.length;
        while (lo < hi) {
            const m = (lo + hi) >> 1;
            if (this.idx[m] < from) lo = m + 1;
            else hi = m;
        }
        return lo < this.idx.length ? this.idx[lo] : -1;
    }
}

/**
 * The history of `source[i]` inside a function called in a local block, as TradingView keeps it: one
 * entry per bar from the first call on, a bar on which the function was not called repeating the last
 * call's value. Nothing before the first call is in it (TV: `ta.change(close, 3)` first called on bar 9
 * is na until bar 12). `fill` (when given) replaces the value written for a bar from the previous entry
 * (e.g. na filled forward).
 */
export class CarryHistory {
    readonly h: History;
    private lastIdx = -1;
    private savedEnd = 0;
    /** Whether the last call started a new bar (false: the same bar computed again). */
    newBar = false;

    constructor(
        sums: 0 | 1 | 2 = 0,
        private readonly fill?: (x: number, prev: number) => number,
        // Retained for budget-aware callers; source history is no longer backfilled on first call.
        _backfill = true,
        budget?: ExecutionBudget,
    ) {
        this.h = new History(sums, budget);
    }

    private write(x: number): void {
        const h = this.h;
        h.push(this.fill ? this.fill(x, h.size ? h.at(0) : NaN) : x);
    }

    /** Adds the value `x` of the call on bar `idx`; the source argument is legacy and not read. */
    push(idx: number, x: any, length: number, _series?: { get(k: number): any }, budget?: ExecutionBudget): void {
        this.visit(idx, length, _series, budget);
        this.write(x == null ? NaN : Number(x));
    }

    /** Starts the call on bar `idx` without adding a value (the bar is then not in the history). */
    visit(idx: number, length: number, _series?: { get(k: number): any }, budget?: ExecutionBudget): void {
        if (length !== 0) assertTaLength(length, 'ta.history');
        const h = this.h;
        h.keepFor(length + 1);
        if (idx !== this.lastIdx) {
            this.newBar = true;
            if (this.lastIdx >= 0) {
                h.compact();
                const skipped = Math.min(idx - this.lastIdx - 1, Math.max(MIN_KEEP, 2 * (length + 1)));
                budget?.chargeWork(skipped, 'ta.history');
                if (h.size) for (let k = 0; k < skipped; k++) h.push(h.at(0));
            }
            this.savedEnd = h.end;
            this.lastIdx = idx;
        } else {
            this.newBar = false;
            h.truncate(this.savedEnd);
        }
    }
}
