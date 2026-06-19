// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Pine Script na-aware "less than or equal" (`<=`).
 *
 * - If either operand is `na`, the result is `na` (matching TradingView).
 * - Values equal within an absolute 1e-10 tolerance are treated as equal, so
 *   `<=` is true — matching TradingView's relational tolerance.
 */
export function __le(context: any) {
    return (a: any, b: any) => {
        const valA = Series.from(a).get(0);
        const valB = Series.from(b).get(0);

        if (typeof valA === 'number' && typeof valB === 'number') {
            if (isNaN(valA) || isNaN(valB)) return NaN;
            if (Math.abs(valA - valB) < 1e-10) return true;
            return valA < valB;
        }

        return valA <= valB;
    };
}
