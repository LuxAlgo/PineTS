// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Pine v5 constant integer division. In Pine v5, `/` truncates toward zero
 * (`11 / 2 === 5`, `-11 / 2 === -5`) ONLY when both operands are
 * 'const'-qualified ints; any 'input'/'simple'/'series' int operand preserves
 * the fractional remainder, and Pine v6+ never truncates at all (see
 * TradingView's v6 migration guide, "Fractional division of constants").
 *
 * The transpiler rewrites a `/` BinaryExpression to this helper ONLY for v5
 * sources and ONLY when BOTH operands are provably const int at compile time
 * (see TypeInferencePass). Everything else keeps native `/`, so genuine
 * fractional division (`4.0 / 2.0`, `close / 2`, `i / 4`) is untouched.
 *
 * Semantics:
 * - `na` (NaN) in either operand propagates → NaN.
 * - Division by zero follows the same rule as native `/`: `Math.trunc` preserves
 *   `1 / 0 → Infinity` and `0 / 0 → NaN`, matching PineTS's existing div-by-zero
 *   behavior (truncation only changes finite results).
 * - Non-numeric operands fall back to native `/` (defensive; should not occur
 *   given the compile-time int guard).
 */
export function __idiv(context: any) {
    return (a: any, b: any) => {
        const valA = Series.from(a).get(0);
        const valB = Series.from(b).get(0);

        if (typeof valA !== 'number' || typeof valB !== 'number') {
            return valA / valB;
        }
        if (isNaN(valA) || isNaN(valB)) return NaN;
        return Math.trunc(valA / valB);
    };
}
