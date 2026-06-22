// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function __eq(context: any) {
    return (a: any, b: any) => {
        // Unwrap Series
        const valA = Series.from(a).get(0);
        const valB = Series.from(b).get(0);

        if (typeof valA === 'number' && typeof valB === 'number') {
            // Pine Script: any comparison with `na` evaluates to `na`, not false.
            // na propagates — use `na(x == y)` to test for it.
            if (isNaN(valA) || isNaN(valB)) return NaN;

            // TradingView treats values equal within an absolute 1e-10 tolerance.
            return Math.abs(valA - valB) < 1e-10;
        }

        return valA === valB;
    };
}
