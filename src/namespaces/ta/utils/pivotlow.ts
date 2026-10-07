// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Pivot low confirmed at index `i` of `source` (oldest first): the candidate `rightbars` bars before
 * `i` if it is a local low, otherwise NaN. Undefined past the end of `source`.
 */
export function pivotlowAt(source: number[], i: number, leftbars: number, rightbars: number): number | undefined {
    if (i >= source.length) return undefined;
    // We need at least leftbars + rightbars + 1 (for the center point) values
    const k = i - (leftbars + rightbars);
    if (!(k >= 0) || !Number.isInteger(k)) return NaN;

    const pivot = source[i - rightbars];
    // An na candidate is never a pivot
    if (pivot === undefined || isNaN(pivot)) return NaN;

    // TradingView's tie rule is asymmetric: a LEFT bar equal to the candidate does
    // not disqualify it (only a strictly lower one does), while a RIGHT bar equal to
    // the candidate does — the later equal bar becomes the pivot instead. Verified
    // against TradingView on a hand-built series (tests/namespaces/ta/tie-handling.test.ts).
    // TradingView also stops scanning at the first na on either side: bars behind it
    // are never examined, so they cannot disqualify the candidate
    // (tests/namespaces/ta/na-window-semantics.test.ts).
    for (let j = 1; j <= leftbars; j++) {
        const v = source[i - rightbars - j];
        if (v === undefined || isNaN(v)) break;
        if (v < pivot) return NaN;
    }

    // Check if the pivot is strictly lower than all bars to the right within rightbars range
    for (let j = 1; j <= rightbars; j++) {
        const v = source[i - rightbars + j];
        if (v === undefined || isNaN(v)) break;
        if (v <= pivot) return NaN;
    }

    return pivot;
}
