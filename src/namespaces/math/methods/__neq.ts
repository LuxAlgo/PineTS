// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Pine Script na-aware inequality comparison.
 *
 * In Pine Script, any comparison involving `na` evaluates to `na` (NOT a
 * usable boolean) — verified against TradingView (`na(na != na)` is `true`):
 *   na != na   → na
 *   1  != na   → na
 *   na != 1    → na
 *
 * This cannot be implemented as `!__eq(a, b)`: `__eq(na, na)` is `na` and
 * `!na` would be `true` — wrong. Both `==` and `!=` must independently
 * propagate `na` when either operand is na. `na` is falsy, so branch/ternary
 * outcomes are unchanged; the difference is only observable via `na()`/`nz()`
 * or arithmetic on the result.
 */
export function __neq(context: any) {
    return (a: any, b: any) => {
        // Unwrap Series
        const valA = Series.from(a).get(0);
        const valB = Series.from(b).get(0);

        if (typeof valA === 'number' && typeof valB === 'number') {
            // Pine Script: any comparison with `na` evaluates to `na`.
            if (isNaN(valA) || isNaN(valB)) return NaN;

            // TradingView treats values equal within an absolute 1e-10 tolerance.
            return Math.abs(valA - valB) >= 1e-10;
        }

        return valA !== valB;
    };
}
