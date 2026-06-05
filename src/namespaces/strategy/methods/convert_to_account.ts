// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

/**
 * Convert a value from the symbol's currency to the account currency.
 *
 * Pine semantics:
 *   - same currency string → return the value unchanged (identity)
 *   - different currency strings → return `na` (NaN), since no FX
 *     rate is available. String equality is used, not economic
 *     equivalence — so nominally pegged pairs like USDC vs USD still
 *     return NaN when their currency strings differ.
 *
 * When `syminfo.currency` is undefined we fall back to identity rather
 * than NaN, so synthetic / array-fed datasets without a syminfo block
 * don't get poisoned.
 */
export function convert_to_account(context: any) {
    return (value: number) => {
        const s = context.strategy;
        const symCur = context.pine?.syminfo?.currency;
        const acctCur = s?.account_currency ?? 'USD';
        if (symCur && symCur !== acctCur) return NaN;
        return value;
    };
}
