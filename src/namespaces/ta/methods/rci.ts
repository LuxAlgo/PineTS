// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { BarRing, validLength } from '../utils/barRing';
import { lowerBound, upperBound } from '../utils/windows';

/** The BarRing of the window, its slots also kept sorted by value (na left out) so ranks need no sort. */
class RankRing {
    ring: BarRing;
    vals: number[] = [];
    slots: number[] = [];

    constructor(
        readonly length: number,
        idx: number,
        series: Series,
    ) {
        this.ring = new BarRing(length);
        this.ring.prefill(idx, series);
        for (let s = 0; s < this.ring.size; s++) this.insert(this.ring.valueOf(s), s);
    }

    write(idx: number, x: number): void {
        const s = this.ring.slot(idx);
        this.remove(this.ring.valueOf(s), s);
        this.ring.write(idx, x);
        this.insert(x, s);
    }

    private insert(v: number, s: number): void {
        if (Number.isNaN(v)) return;
        const i = upperBound(this.vals, v);
        this.vals.splice(i, 0, v);
        this.slots.splice(i, 0, s);
    }

    private remove(v: number, s: number): void {
        if (Number.isNaN(v)) return;
        let i = lowerBound(this.vals, v);
        while (this.slots[i] !== s) i++;
        this.vals.splice(i, 1);
        this.slots.splice(i, 1);
    }
}

/** Pearson correlation (x 100) between the bar order 1..n and the average ranks of `values` (oldest first). */
function rankCorrelation(values: number[], length: number): number {
    const order = values.map((_, i) => i).sort((a, b) => values[a] - values[b]);
    const ranks = new Array(length);
    for (let i = 0; i < length;) {
        let j = i;
        while (j + 1 < length && values[order[j + 1]] === values[order[i]]) j++;
        const rank = (i + j) / 2 + 1;
        for (let k = i; k <= j; k++) ranks[order[k]] = rank;
        i = j + 1;
    }
    const mean = (length + 1) / 2;
    let cov = 0;
    let varX = 0;
    let varY = 0;
    for (let i = 0; i < length; i++) {
        const dx = i + 1 - mean;
        const dy = ranks[i] - mean;
        cov += dx * dy;
        varX += dx * dx;
        varY += dy * dy;
    }
    if (varY === 0) return NaN;
    return (cov / Math.sqrt(varX * varY)) * 100;
}

/**
 * Rank Correlation Index: Spearman's rank correlation between the last `length` values of `source`
 * and their bar order, scaled to -100..100 (100 = rose on every bar).
 *
 * As on TradingView, tied values get their average rank, and the correlation is Pearson's on the
 * ranks (so it is not `1 - 6Σd² / (n(n² - 1))` when there are ties). A window holding an na value
 * gives na: TradingView returns a value there, ranked by a rule not reproduced here. The window is
 * read as TradingView does (in a local block, bars the block skipped are read from slots written
 * earlier, see BarRing).
 *
 * The slots are kept sorted, so a bar costs one pass over them instead of a sort. The sums are of
 * multiples of 1/4, exact in floating point, so the order they are added in does not matter.
 */
export function rci(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        if (!validLength(length)) return NaN;

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `rci_${length}`;
        const series = Series.from(source);
        let win: RankRing = context.taState[stateKey];
        if (!win || win.length !== length) win = context.taState[stateKey] = new RankRing(length, context.idx, series);

        const idx = context.idx;
        const currentValue = series.get(0);
        win.write(idx, currentValue == null ? NaN : currentValue);

        // TradingView's first value comes one bar after the window is full (bar_index = length); a first
        // call after that reads the bars before it (backfill)
        if (length < 2 || idx < length) return NaN;

        // slot s holds bar idx - d(s); d = length is the bar that left the window
        const ring = win.ring;
        const size = ring.size;
        const cur = ring.slot(idx);
        let sortPath = false;
        for (let d = 0; d < length; d++) {
            const s = (cur - d + size) % size;
            const v = ring.readSlot(s, idx - d);
            if (Number.isNaN(v) || idx - d < 0) return NaN;
            if (ring.stalePrefill(s, idx - d)) sortPath = true;
        }
        if (sortPath) {
            const oldestFirst: number[] = [];
            for (let d = length - 1; d >= 0; d--) oldestFirst.push(ring.read(idx - d));
            const r = rankCorrelation(oldestFirst, length);
            return Number.isNaN(r) ? NaN : context.precision(r);
        }

        const out = (cur + 1) % size;
        const mean = (length + 1) / 2;
        let cov = 0;
        let varX = 0;
        let varY = 0;
        for (let i = 0; i < length; i++) {
            const dx = i + 1 - mean;
            varX += dx * dx;
        }
        // ranks over the sorted slots without the one that left; position 1 = the oldest bar
        const vals = win.vals;
        const slots = win.slots;
        for (let i = 0, r = 0; i < vals.length;) {
            let j = i;
            let n = slots[i] === out ? 0 : 1;
            while (j + 1 < vals.length && vals[j + 1] === vals[i]) {
                j++;
                if (slots[j] !== out) n++;
            }
            const dy = r + (n - 1) / 2 + 1 - mean;
            for (let k = i; k <= j; k++) {
                if (slots[k] === out) continue;
                const d = (cur - slots[k] + size) % size;
                cov += (length - d - mean) * dy;
                varY += dy * dy;
            }
            r += n;
            i = j + 1;
        }
        if (varY === 0) return NaN;

        return context.precision((cov / Math.sqrt(varX * varY)) * 100);
    };
}
