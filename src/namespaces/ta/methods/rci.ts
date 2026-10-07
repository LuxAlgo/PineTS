// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { CallWindow, lowerBound, upperBound } from '../utils/windows';

/** The values of the last calls, also kept sorted (with their call number) so ranks need no sort. */
class RankWindow extends CallWindow {
    seq = 0;
    nan = 0;
    vals: number[] = [];
    seqs: number[] = [];
    // buffers for the current call's window in order (reused)
    mergedVals: number[] = [];
    mergedSeqs: number[] = [];

    protected pushed(x: number, evict: boolean, y: number): void {
        this.seq++;
        if (Number.isNaN(x)) this.nan++;
        else this.insert(x, this.seq);
        if (evict) {
            if (Number.isNaN(y)) this.nan--;
            else this.remove(y, this.seq - this.ring.size);
        }
    }

    protected rebuilt(): void {
        this.nan = 0;
        this.vals = [];
        this.seqs = [];
        for (let i = this.ring.size - 1; i >= 0; i--) {
            this.seq++;
            const v = this.ring.at(i);
            if (Number.isNaN(v)) this.nan++;
            else this.insert(v, this.seq);
        }
    }

    private insert(v: number, s: number): void {
        const i = upperBound(this.vals, v);
        this.vals.splice(i, 0, v);
        this.seqs.splice(i, 0, s);
    }

    private remove(v: number, s: number): void {
        let i = lowerBound(this.vals, v);
        while (this.seqs[i] !== s) i++;
        this.vals.splice(i, 1);
        this.seqs.splice(i, 1);
    }
}

/** Pearson correlation (x 100) between the bar order 1..n and the average ranks of `values` (oldest first). */
function rankCorrelation(values: number[], length: number): number {
    const order = values.map((_, i) => i).sort((a, b) => values[a] - values[b]);
    const ranks = new Array(length);
    for (let i = 0; i < length; ) {
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
 * gives na: TradingView returns a value there, ranked by a rule not reproduced here.
 *
 * The window is kept sorted, so a bar costs one pass over it instead of a sort. The sums are of
 * multiples of 1/4, exact in floating point, so the order they are added in does not matter.
 */
export function rci(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `rci_${length}`;
        if (!context.taState[stateKey]) context.taState[stateKey] = new RankWindow();
        const win: RankWindow = context.taState[stateKey];
        win.begin(context.idx);

        const currentValue = Series.from(source).get(0);
        const x = currentValue == null ? NaN : currentValue;
        win.push(context.idx, x, length, { trimOnce: true });

        // TradingView's first value comes one bar after the window is full (bar_index = length).
        const t = win.t!;
        const nan = t.rebuilt ? t.values.filter((v) => Number.isNaN(v)).length : win.nan + (Number.isNaN(x) ? 1 : 0) - (t.evict && Number.isNaN(win.evicted()) ? 1 : 0);
        if (length < 2 || win.calls + 1 <= length || nan > 0) {
            return NaN;
        }

        if (t.rebuilt || win.size !== length) {
            const oldestFirst: number[] = [];
            for (let i = win.size - 1; i >= 0; i--) oldestFirst.push(win.at(i));
            const r = rankCorrelation(oldestFirst, length);
            return Number.isNaN(r) ? NaN : context.precision(r);
        }

        // Walk the committed values in order (without the one dropped now) with x merged in
        const evictSeq = t.evict ? win.seq - win.ring.size + 1 : -1;
        const firstSeq = t.evict ? evictSeq + 1 : win.seq - win.ring.size + 1;
        const vals = win.mergedVals;
        const seqs = win.mergedSeqs;
        vals.length = 0;
        seqs.length = 0;
        let xDone = false;
        for (let j = 0; j < win.vals.length; j++) {
            if (win.seqs[j] === evictSeq) continue;
            if (!xDone && win.vals[j] >= x) {
                vals.push(x);
                seqs.push(win.seq + 1);
                xDone = true;
            }
            vals.push(win.vals[j]);
            seqs.push(win.seqs[j]);
        }
        if (!xDone) {
            vals.push(x);
            seqs.push(win.seq + 1);
        }

        const mean = (length + 1) / 2;
        let cov = 0;
        let varX = 0;
        let varY = 0;
        for (let i = 0; i < length; i++) {
            const dx = i + 1 - mean;
            varX += dx * dx;
        }
        for (let i = 0; i < length; ) {
            let j = i;
            while (j + 1 < length && vals[j + 1] === vals[i]) j++;
            const dy = (i + j) / 2 + 1 - mean;
            for (let k = i; k <= j; k++) {
                cov += (seqs[k] - firstSeq + 1 - mean) * dy;
                varY += dy * dy;
            }
            i = j + 1;
        }
        if (varY === 0) return NaN;

        return context.precision((cov / Math.sqrt(varX * varY)) * 100);
    };
}
