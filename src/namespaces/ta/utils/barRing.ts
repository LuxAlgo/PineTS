// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { CarryHistory } from './history';
import { assertTaLength, validTaLength } from './assertTaLength';
import type { ExecutionBudget } from '../../../security/ExecutionBudget';

/**
 * The source of `ta.linreg` / `ta.rci` as TradingView reads it: `length + 1` slots indexed by bar index, written only when the function is
 * called. Inside a local block, a bar the block skipped still holds what was written in its slot
 * `length + 1` (or a multiple of it) bars earlier, or 0 if nothing was. A function first called on a
 * later bar reads 0 for the slots before its first call (TV: `ta.linreg(close, 5, 0)` first called on
 * bar 9 gives 2,177 for a close near 3,600).
 */
export class BarRing {
    readonly size: number;
    // a slot never written holds 0
    private vals: number[];

    constructor(readonly length: number) {
        assertTaLength(length, 'ta.barRing');
        this.size = length + 1;
        this.vals = new Array(this.size).fill(0);
    }

    slot(bar: number): number {
        return ((bar % this.size) + this.size) % this.size;
    }

    write(bar: number, v: number): void {
        this.vals[this.slot(bar)] = v;
    }

    /** The value read for `bar`; na before the first bar of the chart. */
    read(bar: number): number {
        if (bar < 0) return NaN;
        return this.vals[this.slot(bar)];
    }

    /** Value held by slot `s` as read for `bar` (a bar of that slot). */
    readSlot(s: number, _bar: number): number {
        return this.vals[s];
    }

    valueOf(s: number): number {
        return this.vals[s];
    }
}

/** A window length the functions accept (an int >= 1); any other gives na. */
export const validLength = (length: number) => validTaLength(length, 'ta.linreg');

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
    step(idx: number, x: number, length: number, series: Series, budget?: ExecutionBudget): [number, number] | undefined {
        if (!validLength(length)) return undefined;
        if (!this.ring || this.ring.length !== length) {
            budget?.chargeWork(length, 'ta.linreg');
            budget?.chargeMemory(24 * (length + 1), 'ta.linreg');
            this.ring = new BarRing(length);
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
        budget?.chargeWork(length, 'ta.linreg');
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
    private carry: CarryHistory;
    private firstLength = NaN;
    private seriesForm = false;
    // [slope, intercept] of the last call that had a regression line (committed), and after this call
    private committedLine: [number, number] | null = null;
    line: [number, number] | null = null;

    constructor(private readonly budget?: ExecutionBudget) {
        this.carry = new CarryHistory(2, undefined, true, budget);
    }

    step(idx: number, x: number, length: number, series: Series): [number, number] | undefined {
        this.carry.push(idx, x, validLength(length) ? length : 1, series, this.budget);
        if (this.carry.newBar) this.committedLine = this.line;
        this.line = this.committedLine;
        if (Number.isNaN(this.firstLength)) this.firstLength = length;
        else if (length !== this.firstLength) this.seriesForm = true;
        if (!this.seriesForm) return this.slots.step(idx, x, length, series, this.budget);

        const h = this.carry.h;
        if (!validLength(length) || h.size < length || h.nas(length) > 0) return undefined;
        return [h.sum(length), h.wsum(length)];
    }
}
