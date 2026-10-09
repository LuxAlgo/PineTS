// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { CarryHistory } from './history';

/**
 * The source of `ta.linreg` / `ta.rci` as TradingView reads it: `length + 1` slots indexed by bar index, written only when the function is
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

/** A window length the functions accept (an int >= 1); any other gives na. */
export const validLength = (length: number) => Number.isInteger(length) && length >= 1;

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

/*
 * TradingView compiles ta.linreg two ways. With a const / simple length (a literal, an input) they
 * read the BarRing slots above. With a series length they read `source[i]`, the history inside the
 * function, where a bar a local block skipped repeats the last call's value (CarryHistory), whatever
 * `length` is on each call. PineTS cannot see the qualifier at run time: a call site takes the series
 * form from the first call whose length differs from the first one (a length that varies), and keeps
 * the CarryHistory up to date until then so that it can switch. Both forms agree on calls made every bar.
 */
/** ta.linreg: [S, N] (N weighing the newest value `length`) in the slot form, or the series form. */
export class LinregCall {
    private slots = new TvWeightedRing();
    private carry = new CarryHistory(2);
    private firstLength = NaN;
    private seriesForm = false;
    // [slope, intercept] of the last call that had a regression line (committed), and after this call
    private committedLine: [number, number] | null = null;
    line: [number, number] | null = null;

    step(idx: number, x: number, length: number, series: Series): [number, number] | undefined {
        this.carry.push(idx, x, validLength(length) ? length : 1, series);
        if (this.carry.newBar) this.committedLine = this.line;
        this.line = this.committedLine;
        if (Number.isNaN(this.firstLength)) this.firstLength = length;
        else if (length !== this.firstLength) this.seriesForm = true;
        if (!this.seriesForm) return this.slots.step(idx, x, length, series);

        const h = this.carry.h;
        if (!validLength(length) || h.size < length || h.nas(length) > 0) return undefined;
        return [h.sum(length), h.wsum(length)];
    }
}
