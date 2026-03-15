// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Pine Script na-aware inequality comparison.
 *
 * In Pine Script, any comparison involving `na` returns `false`:
 *   na != na   → false
 *   1  != na   → false
 *   na != 1    → false
 *
 * This cannot be implemented as `!__eq(a, b)` because __eq(na, na) returns
 * false, and !false = true — which is wrong. Both == and != must independently
 * return false when either operand is na.
 */
export function __neq(context: any) {
    return (a: any, b: any) => {
        // Unwrap Series
        const valA = Series.from(a).get(0);
        const valB = Series.from(b).get(0);

        if (typeof valA === 'number' && typeof valB === 'number') {
            // Pine Script: any comparison with na (NaN) returns false
            if (isNaN(valA) || isNaN(valB)) return false;

            // Use epsilon comparison consistent with __eq
            return Math.abs(valA - valB) >= 1e-9;
        }

        return valA !== valB;
    };
}
