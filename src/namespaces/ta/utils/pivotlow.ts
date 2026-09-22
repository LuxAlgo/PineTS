// SPDX-License-Identifier: AGPL-3.0-only

// Pivot low identifies a local low point
export function pivotlow(source: number[], leftbars: number, rightbars: number): number[] {
    const result = new Array(source.length).fill(NaN);

    // We need at least leftbars + rightbars + 1 (for the center point) values
    for (let i = leftbars + rightbars; i < source.length; i++) {
        const pivot = source[i - rightbars];
        let isPivot = true;

        // TradingView's tie rule is asymmetric: a LEFT bar equal to the candidate does
        // not disqualify it (only a strictly lower one does), while a RIGHT bar equal to
        // the candidate does — the later equal bar becomes the pivot instead. Verified
        // against TradingView on a hand-built series (tests/namespaces/ta/tie-handling.test.ts).
        for (let j = 1; j <= leftbars; j++) {
            if (source[i - rightbars - j] < pivot) {
                isPivot = false;
                break;
            }
        }

        // Check if the pivot is strictly lower than all bars to the right within rightbars range
        if (isPivot) {
            for (let j = 1; j <= rightbars; j++) {
                if (source[i - rightbars + j] <= pivot) {
                    isPivot = false;
                    break;
                }
            }
        }

        // If this is a pivot point, set its value, otherwise keep NaN
        if (isPivot) {
            result[i] = pivot;
        }
    }

    return result;
}

