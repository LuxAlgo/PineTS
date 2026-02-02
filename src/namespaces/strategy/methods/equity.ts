// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

/**
 * Returns the current equity (initial capital + net profit + unrealized P&L)
 */
export function equity(context: any) {
    return () => {
        return context.strategy?.equity || context.strategy?.config?.initial_capital || 10000;
    };
}
