// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Pine integer division — the `/` (and `%`, via the transpiler) operator applied
 * to two **integer** operands. In Pine, `int / int` yields an `int`: the result
 * is truncated toward zero (`11 / 2 === 5`, `-11 / 2 === -5`), whereas JavaScript
 * `/` is always float division (`5.5`).
 *
 * The transpiler rewrites a `/` BinaryExpression to this helper ONLY when BOTH
 * operands are provably `int` at compile time (see TypeInferencePass). Any float
 * operand keeps native `/`, so genuine float division (`4.0 / 2.0`, `close / 2`)
 * is untouched.
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
