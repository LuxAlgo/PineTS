// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { MonoDeque } from './windows';

/**
 * The source of `ta.highest` / `ta.lowest` / `ta.highestbars` / `ta.lowestbars` / `ta.linreg` / `ta.rci`
 * as TradingView reads it: `length + 1` slots indexed by bar index, written only when the function is
 * called. Inside a local block, a bar the block skipped still holds what was written in its slot
 * `length + 1` (or a multiple of it) bars earlier, or 0 if nothing was.
 *
 * Before the first call PineTS fills the slots of the bars behind it from the source history (the
 * backfill of the other window functions, so a function first called on the last bar sees those bars).
 * Such a value is read only for its own bar; for a later bar it reads 0, like a slot never written.
 */
export class BarRing {
    readonly size: number;
    private vals: number[];
    // the bar a slot was last filled for, and whether a call wrote it
    private bars: number[];
    private byCall: boolean[];

    constructor(readonly length: number) {
        this.size = length + 1;
        this.vals = new Array(this.size).fill(0);
        this.bars = new Array(this.size).fill(-1);
        this.byCall = new Array(this.size).fill(false);
    }

    slot(bar: number): number {
        return ((bar % this.size) + this.size) % this.size;
    }

    write(bar: number, v: number): void {
        const s = this.slot(bar);
        this.vals[s] = v;
        this.bars[s] = bar;
        this.byCall[s] = true;
    }

    /** Fills the slots of the `length` bars before `bar` from the source history. */
    prefill(bar: number, series: Series): void {
        for (let b = Math.max(0, bar - this.length); b < bar; b++) {
            const s = this.slot(b);
            this.vals[s] = series.get(bar - b);
            this.bars[s] = b;
            this.byCall[s] = false;
        }
    }

    /** The value read for `bar`; na before the first bar of the chart. */
    read(bar: number): number {
        if (bar < 0) return NaN;
        const s = this.slot(bar);
        return this.byCall[s] || this.bars[s] === bar ? this.vals[s] : 0;
    }

    /** Value held by slot `s` as read for `bar` (a bar of that slot). */
    readSlot(s: number, bar: number): number {
        return this.byCall[s] || this.bars[s] === bar ? this.vals[s] : 0;
    }

    /** Whether slot `s` holds a backfilled value read as 0 for `bar`. */
    stalePrefill(s: number, bar: number): boolean {
        return !this.byCall[s] && this.bars[s] >= 0 && this.bars[s] !== bar;
    }

    valueOf(s: number): number {
        return this.vals[s];
    }
}

const nanLike = (v: any) => isNaN(v);

/** A window length the functions accept (an int >= 1); any other gives na. */
export const validLength = (length: number) => Number.isInteger(length) && length >= 1;

/**
 * TradingView's ta.highest / ta.lowest (and the *bars forms): the extreme and its bar are kept from call
 * to call; a strictly better value replaces it (so the oldest of equal values stays), and when it is
 * `length` bars old the window is rescanned through the BarRing. An na value gives na and the next value
 * starts afresh; a rescan stops at an na. PineTS rescans on the first call (backfill).
 */
export class TvExtreme {
    private ring: BarRing | null = null;
    // bar of the extreme; -1: none (after na), -2: rescan on the next call (first call)
    private best = NaN;
    private bestBar = -2;
    private lastIdx = -1;
    private savedBest = NaN;
    private savedBestBar = -2;
    // the values of the previous calls (from the last na), for a rescan of a window without skipped
    // bars, where the slots hold exactly those values: O(1) amortized instead of O(length)
    private dq: MonoDeque;
    private pendingBar = -1;
    private pendingVal = NaN;
    // the most recent bar without a call
    private lastGap = -Infinity;
    /** The extreme found by the last `step`. */
    value = NaN;

    constructor(private readonly max: boolean) {
        this.dq = new MonoDeque(max);
    }

    private queue(bar: number, v: number): void {
        if (nanLike(v)) this.dq.clear();
        else this.dq.push(bar, v);
    }

    private better(a: number, b: number): boolean {
        return this.max ? a > b : a < b;
    }

    /** Bar of the extreme for the call on bar `idx` with value `x` (in `value`), -1 at an na `x`. */
    step(idx: number, x: any, length: number, series: Series): number {
        if (!validLength(length)) {
            this.value = NaN;
            return -1;
        }
        if (!this.ring || this.ring.length !== length) {
            this.ring = new BarRing(length);
            this.ring.prefill(idx, series);
            this.best = NaN;
            this.bestBar = -2;
            this.lastIdx = -1;
            this.dq.clear();
            for (let b = Math.max(0, idx - length); b < idx; b++) this.queue(b, series.get(idx - b));
            this.pendingBar = -1;
            this.lastGap = -Infinity;
        }
        // a second call on the same bar (live bar) starts from the state before the first one
        if (idx === this.lastIdx) {
            this.best = this.savedBest;
            this.bestBar = this.savedBestBar;
        } else {
            this.savedBest = this.best;
            this.savedBestBar = this.bestBar;
            this.lastIdx = idx;
            if (this.pendingBar >= 0) {
                this.queue(this.pendingBar, this.pendingVal);
                if (idx - this.pendingBar > 1) this.lastGap = idx - 1;
            }
            this.pendingBar = idx;
        }
        this.pendingVal = x;

        this.ring.write(idx, x);
        if (nanLike(x)) {
            this.best = NaN;
            this.bestBar = -1;
            this.value = NaN;
            return -1;
        }
        if (this.bestBar === -2) this.rescan(idx, length);
        else if (this.bestBar === -1 || this.better(x, this.best)) {
            this.best = x;
            this.bestBar = idx;
        } else if (idx - this.bestBar >= length) this.rescan(idx, length);
        this.value = this.best;
        return this.bestBar;
    }

    private rescan(idx: number, length: number): void {
        const from = idx - length + 1;
        if (this.lastGap < from) {
            // x (the current value) is not na here; an older equal value wins
            const x = this.pendingVal;
            this.dq.expire(from);
            const p = this.dq.first(from);
            if (p >= 0 && !this.better(x, this.dq.valAt(p))) {
                this.best = this.dq.valAt(p);
                this.bestBar = this.dq.seqAt(p);
            } else {
                this.best = x;
                this.bestBar = idx;
            }
            return;
        }
        let best = NaN;
        let bar = -1;
        for (let i = 0; i < length; i++) {
            const b = idx - i;
            const v = this.ring!.read(b);
            if (nanLike(v)) break;
            // newest first: an older equal value replaces it
            if (bar < 0 || !this.better(best, v)) {
                best = v;
                bar = b;
            }
        }
        this.best = best;
        this.bestBar = bar;
    }
}

/**
 * The window of ta.linreg as TradingView reads it (BarRing), with its sum S and weighted sum N (newest
 * weight `length`). After a call on the previous bar they move in O(1): the value leaving is the one
 * read for bar idx - length. Otherwise (and every `length` calls, to bound the float drift) they are
 * summed over the window.
 */
export class TvWeightedRing {
    private ring: BarRing | null = null;
    private lastCall = -1;
    private S = 0;
    private N = 0;
    private ok = false;
    private steps = 0;
    private savedFor = -1;
    private saved: [number, number, number, boolean, number] = [-1, 0, 0, false, 0];

    /** [S, N] of the window of the call on bar `idx`, undefined when it holds na. */
    step(idx: number, x: number, length: number, series: Series): [number, number] | undefined {
        if (!validLength(length)) return undefined;
        if (!this.ring || this.ring.length !== length) {
            this.ring = new BarRing(length);
            this.ring.prefill(idx, series);
            this.lastCall = -1;
            this.ok = false;
            this.savedFor = -1;
        }
        if (idx === this.savedFor) [this.lastCall, this.S, this.N, this.ok, this.steps] = this.saved;
        else {
            this.savedFor = idx;
            this.saved = [this.lastCall, this.S, this.N, this.ok, this.steps];
        }

        const ring = this.ring;
        const consecutive = this.ok && this.lastCall === idx - 1 && this.steps + 1 < length;
        const y = consecutive ? ring.read(idx - length) : NaN;
        ring.write(idx, x);
        this.lastCall = idx;
        if (consecutive && !Number.isNaN(x) && !Number.isNaN(y)) {
            this.N = this.N - this.S + length * x;
            this.S = this.S - y + x;
            this.steps++;
            return [this.S, this.N];
        }
        let S = 0;
        let N = 0;
        for (let i = 0; i < length; i++) {
            const v = ring.read(idx - i);
            N += v * (length - i);
            S += v;
        }
        this.S = S;
        this.N = N;
        this.steps = 0;
        this.ok = !Number.isNaN(S + N);
        return this.ok ? [S, N] : undefined;
    }
}
