// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { CarryHistory } from './history';
import { lowerBound, upperBound } from './windows';

const isNa = (v: number) => Number.isNaN(v);

/**
 * The values of the last `length` calls of ta.percentile_linear_interpolation /
 * ta.percentile_nearest_rank, in the order TradingView keeps them: a call inserts its value before the
 * first one it is smaller than, scanning from the start, then the oldest values are removed (their
 * first occurrence) while more than `length` are held. An na is smaller than nothing, so it goes to
 * the end, but a value inserted later goes after it as well: the array is sorted only while it holds
 * no na, and the result read from it can then be na. With fewer than `length` values (a series length
 * that grew), the array is completed from `source[count]`, the history inside the function (in a local
 * block, a skipped bar repeating the last call's value). Verified against TradingView with synthetic
 * na patterns and lengths.
 *
 * Without na, the insert and the removal are binary searches. A first call on a later bar is completed
 * from the source history, like the other window functions' backfill.
 */
export class PercentileArray {
    readonly arr: number[] = [];
    private nan = 0;
    // values held, oldest at `head`
    private held: number[] = [];
    private head = 0;
    private carry = new CarryHistory();
    // undo of the current bar's changes, for a bar computed again (live bar)
    private undoLog: (() => void)[] = [];

    private lastTick: unknown = undefined;

    /**
     * The array after the call on bar `idx`; undefined while fewer than `length` values are held. `tick`
     * identifies the script's execution: a second call in the same one (a loop) adds its value too, as on
     * TradingView, while a new execution of the same bar (live bar) starts from the previous bars.
     */
    step(idx: number, x: any, length: number, series: Series, tick?: unknown): number[] | undefined {
        const v = x == null ? NaN : Number(x);
        this.carry.push(idx, v, length, series);
        if (this.carry.newBar) this.commit();
        else if (tick === undefined || tick !== this.lastTick) this.rollback();
        this.lastTick = tick;

        this.insert(v);
        this.held.push(v);
        this.undoLog.push(() => this.held.pop());
        while (this.held.length - this.head > length) {
            const y = this.held[this.head++];
            this.undoLog.push(() => this.head--);
            this.removeValue(y);
        }
        const h = this.carry.h;
        while (this.held.length - this.head < length && h.size > this.held.length - this.head) {
            const y = h.at(this.held.length - this.head);
            if (this.head > 0) {
                const old = this.held[--this.head];
                this.held[this.head] = y;
                this.undoLog.push(() => {
                    this.held[this.head] = old;
                    this.head++;
                });
            } else {
                this.held.unshift(y);
                this.undoLog.push(() => this.held.shift());
            }
            this.insert(y);
        }
        return this.held.length - this.head < length ? undefined : this.arr;
    }

    private commit(): void {
        this.undoLog.length = 0;
        if (this.head > 1024 && this.head * 2 > this.held.length) {
            this.held = this.held.slice(this.head);
            this.head = 0;
        }
    }

    private rollback(): void {
        for (let i = this.undoLog.length - 1; i >= 0; i--) this.undoLog[i]();
        this.undoLog.length = 0;
    }

    private insert(x: number): void {
        const p = this.insertAt(x);
        this.arr.splice(p, 0, x);
        if (isNa(x)) this.nan++;
        this.undoLog.push(() => {
            this.arr.splice(p, 1);
            if (isNa(x)) this.nan--;
        });
    }

    private removeValue(y: number): void {
        const p = this.indexOf(y);
        if (p < 0) return;
        this.arr.splice(p, 1);
        if (isNa(y)) this.nan--;
        this.undoLog.push(() => {
            this.arr.splice(p, 0, y);
            if (isNa(y)) this.nan++;
        });
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
        if (this.nan === 0 && !isNa(y)) {
            const p = lowerBound(a, y);
            return a[p] === y ? p : -1;
        }
        if (isNa(y)) {
            for (let i = 0; i < a.length; i++) if (isNa(a[i])) return i;
            return -1;
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
