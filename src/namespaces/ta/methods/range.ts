// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { CallWindow, MonoDeque } from '../utils/windows';

/** The non-na values of the last calls with their running maximum and minimum. */
class RangeWindow extends CallWindow {
    private seq = 0;
    private hi = new MonoDeque(true);
    private lo = new MonoDeque(false);

    protected pushed(x: number): void {
        this.seq++;
        this.hi.push(this.seq, x);
        this.lo.push(this.seq, x);
        const from = this.seq - this.ring.size + 1;
        this.hi.expire(from);
        this.lo.expire(from);
    }

    protected rebuilt(): void {
        this.hi.clear();
        this.lo.clear();
        for (let i = this.ring.size - 1; i >= 0; i--) {
            this.seq++;
            this.hi.push(this.seq, this.ring.at(i));
            this.lo.push(this.seq, this.ring.at(i));
        }
    }

    /** [max, min] of the current call's window. */
    extremes(): [number, number] {
        const t = this.t;
        if (!t || t.rebuilt) {
            let max = -Infinity;
            let min = Infinity;
            for (let i = 0; i < this.size; i++) {
                const v = this.at(i);
                if (v > max) max = v;
                if (v < min) min = v;
            }
            return [max, min];
        }
        const pi = this.hi.first(this.seq - this.size + 2);
        const pl = this.lo.first(this.seq - this.size + 2);
        // the newest value wins only when strictly better: among equal values the oldest comes first
        const max = pi < 0 || t.x > this.hi.valAt(pi) ? t.x : this.hi.valAt(pi);
        const min = pl < 0 || t.x < this.lo.valAt(pl) ? t.x : this.lo.valAt(pl);
        return [max, min];
    }
}

/**
 * Range
 *
 * Returns the difference between the highest and lowest values of a series over a given length.
 *
 * Not `ta.highest - ta.lowest`: TradingView's range keeps the last `length` non-na values
 * (an na bar is skipped, so the result repeats), returns na until `length` of them have
 * been seen, and starts its maximum from the smallest positive double, so a window of
 * negative values measures down from 0 (tests/namespaces/ta/range-na.test.ts).
 */
export function range(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        if (!(length >= 1)) return NaN;

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `range_${length}`;
        if (!context.taState[stateKey]) context.taState[stateKey] = new RangeWindow();
        const win: RangeWindow = context.taState[stateKey];
        win.begin(context.idx);

        const isNa = (v: any) => v === undefined || v === null || isNaN(v);
        const series = Series.from(source);
        const currentValue = series.get(0);

        if (win.calls === 0) {
            // First call (conditional block, barstate.islast): seed the window from the source
            // history, like the other window functions' backfill.
            const values: number[] = [];
            for (let i = 1; i <= context.idx && values.length < length; i++) {
                const v = series.get(i);
                if (!isNa(v)) values.push(v);
            }
            if (!isNa(currentValue)) values.unshift(currentValue);
            while (values.length > length) values.pop();
            win.set(values, length);
        } else if (!isNa(currentValue)) {
            win.push(context.idx, currentValue, length);
        } else if (win.ring.size > length) {
            win.set(win.ring.toArray().slice(0, length), length);
        } else {
            win.t = null;
        }

        if (win.size < length) {
            return NaN;
        }

        const [max, min] = win.extremes();
        return context.precision((max > Number.MIN_VALUE ? max : Number.MIN_VALUE) - min);
    };
}
