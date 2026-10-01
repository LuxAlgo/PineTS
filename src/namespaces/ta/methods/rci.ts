// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Rank Correlation Index: Spearman's rank correlation between the last `length` values of `source`
 * and their bar order, scaled to -100..100 (100 = rose on every bar).
 *
 * As on TradingView, tied values get their average rank, and the correlation is Pearson's on the
 * ranks (so it is not `1 - 6Σd² / (n(n² - 1))` when there are ties). A window holding an na value
 * gives na: TradingView returns a value there, ranked by a rule not reproduced here.
 */
export function rci(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `rci_${length}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: -1,
                // Committed state
                prevWindow: [],
                prevCount: 0,
                // Tentative state
                currentWindow: [],
                currentCount: 0,
            };
        }

        const state = context.taState[stateKey];

        // Commit logic
        if (context.idx > state.lastIdx) {
            if (state.lastIdx >= 0) {
                state.prevWindow = state.currentWindow;
                state.prevCount = state.currentCount;
            }
            state.lastIdx = context.idx;
        }

        const currentValue = Series.from(source).get(0);

        // Window oldest → newest
        const window: number[] = state.prevWindow.slice();
        window.push(currentValue == null ? NaN : currentValue);
        if (window.length > length) window.shift();
        state.currentWindow = window;
        state.currentCount = state.prevCount + 1;

        // TradingView's first value comes one bar after the window is full (bar_index = length).
        if (length < 2 || state.currentCount <= length || window.some((v) => Number.isNaN(v))) {
            return NaN;
        }

        // Average ranks of the values (ascending)
        const order = window.map((_, i) => i).sort((a, b) => window[a] - window[b]);
        const ranks = new Array(length);
        for (let i = 0; i < length; ) {
            let j = i;
            while (j + 1 < length && window[order[j + 1]] === window[order[i]]) j++;
            const rank = (i + j) / 2 + 1;
            for (let k = i; k <= j; k++) ranks[order[k]] = rank;
            i = j + 1;
        }

        // Pearson correlation between the bar order (1..n) and the ranks
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

        return context.precision((cov / Math.sqrt(varX * varY)) * 100);
    };
}
