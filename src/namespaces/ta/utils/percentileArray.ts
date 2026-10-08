// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { lowerBound, upperBound } from './windows';

const isNa = (v: number) => Number.isNaN(v);

/**
 * The values of the last `length` calls of ta.percentile_linear_interpolation /
 * ta.percentile_nearest_rank, in the order TradingView keeps them: a call inserts its value before the
 * first one it is smaller than, scanning from the start, then the value of `length` calls back is
 * removed (its first occurrence). An na is smaller than nothing, so it goes to the end, but a value
 * inserted later goes after it as well: the array is sorted only while it holds no na, and the result
 * read from it can then be na. Verified against TradingView with synthetic na patterns.
 *
 * Without na, the insert and the removal are binary searches. A first call on a later bar is backfilled
 * from the source history, like the other window functions.
 */
export class PercentileArray {
    readonly arr: number[] = [];
    private nan = 0;
    // values of the calls in the window, oldest at `head`
    private hist: number[] = [];
    private head = 0;
    private length = NaN;
    private lastIdx = -1;
    // the last call's insert / removal, undone when the same bar is computed again (live bar)
    private ins = -1;
    private rem = -1;
    private remVal = NaN;

    /** The array after the call on bar `idx`; undefined while fewer than `length` calls are held. */
    step(idx: number, x: any, length: number, series: Series): number[] | undefined {
        const v = x == null ? NaN : Number(x);
        if (length !== this.length) {
            this.reset(length);
            if (idx >= length - 1) for (let k = length - 1; k >= 1; k--) this.add(series.get(k), length);
        } else if (idx === this.lastIdx) this.undo();
        this.lastIdx = idx;
        this.add(v, length);
        return this.hist.length - this.head < length ? undefined : this.arr;
    }

    private reset(length: number): void {
        this.arr.length = 0;
        this.nan = 0;
        this.hist = [];
        this.head = 0;
        this.length = length;
        this.lastIdx = -1;
    }

    private add(v: any, length: number): void {
        const x = v == null ? NaN : Number(v);
        this.ins = this.insertAt(x);
        this.arr.splice(this.ins, 0, x);
        if (isNa(x)) this.nan++;
        this.hist.push(x);
        this.rem = -1;
        if (this.hist.length - this.head > length) {
            const y = this.hist[this.head++];
            this.rem = this.indexOf(y);
            this.remVal = y;
            this.arr.splice(this.rem, 1);
            if (isNa(y)) this.nan--;
            if (this.head > 1024 && this.head * 2 > this.hist.length) {
                this.hist = this.hist.slice(this.head);
                this.head = 0;
            }
        }
    }

    private undo(): void {
        if (this.rem >= 0) {
            this.arr.splice(this.rem, 0, this.remVal);
            if (isNa(this.remVal)) this.nan++;
            if (this.head > 0) this.hist[--this.head] = this.remVal;
            else this.hist.unshift(this.remVal);
        }
        const x = this.hist.pop()!;
        this.arr.splice(this.ins, 1);
        if (isNa(x)) this.nan--;
    }

    private insertAt(x: number): number {
        const a = this.arr;
        if (this.nan === 0 && !isNa(x)) return upperBound(a, x);
        let j = 0;
        while (j < a.length && !(x < a[j])) j++;
        return j;
    }

    private indexOf(y: number): number {
        const a = this.arr;
        if (this.nan === 0 && !isNa(y)) return lowerBound(a, y);
        if (isNa(y)) {
            for (let i = 0; i < a.length; i++) if (isNa(a[i])) return i;
        }
        return a.indexOf(y);
    }
}

/** ta.percentile_nearest_rank of the array (index from its length, na if it points at an na). */
export function nearestRank(a: number[], percentage: number): number {
    const n = a.length;
    const index = Math.min(Math.max(Math.ceil((percentage / 100) * n) - 1, 0), n - 1);
    return a[index];
}

/** ta.percentile_linear_interpolation of the array: between an entry and the next (na if one is na). */
export function linearInterpolation(a: number[], percentage: number): number {
    const n = a.length;
    const index = Math.min(Math.max((percentage / 100) * n - 0.5, 0), n - 1);
    const lo = Math.floor(index);
    if (lo >= n - 1) return a[n - 1];
    return a[lo] + (index - lo) * (a[lo + 1] - a[lo]);
}
