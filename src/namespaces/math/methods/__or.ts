// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Strict Pine v5 `or`. Counterpart of `__and`: both operands are evaluated
 * (v5 semantics) even when the left one is already true. Result mirrors native `||`.
 */
export function __or(_context: any) {
    return (a: any, b: any) => a || b;
}
