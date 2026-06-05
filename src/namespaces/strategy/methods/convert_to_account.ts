// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

/**
 * Convert a value from the symbol's currency to the account currency.
 *
 * TV behavior — verified against `conversion.pine` on BTCUSDC (symbol
 * currency = USDC) with account currency = USD:
 *   - same currency string → return the value unchanged (identity)
 *   - different currency strings → return `na` (NaN), since there's no
 *     FX rate available. This is TV's behavior even for nominally
 *     pegged pairs like USDC vs USD — string equality, not economic
 *     equivalence.
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
