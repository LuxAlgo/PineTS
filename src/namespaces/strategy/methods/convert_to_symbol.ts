// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

/**
 * Inverse of convert_to_account: from account currency → symbol currency.
 *
 * Mirrors convert_to_account's TV-matching behavior: identity passthrough
 * when account and symbol currencies are the same string, NaN when they
 * differ. See convert_to_account.ts for the full rationale.
 */
export function convert_to_symbol(context: any) {
    return (value: number) => {
        const s = context.strategy;
        const symCur = context.pine?.syminfo?.currency;
        const acctCur = s?.account_currency ?? 'USD';
        if (symCur && symCur !== acctCur) return NaN;
        return value;
    };
}
