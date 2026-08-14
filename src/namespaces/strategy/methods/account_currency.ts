// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Account currency configured in the strategy() declaration's `currency=`.
 * Defaults to 'USD'. Matches Pine's strategy.account_currency.
 */
export function account_currency(context: any) {
    return () => context.strategy?.account_currency ?? 'USD';
}
