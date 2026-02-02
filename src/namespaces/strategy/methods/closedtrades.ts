// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

/**
 * Returns the number of closed trades
 */
export function closedtrades(context: any) {
    return () => {
        return context.strategy?.closedTrades?.length || 0;
    };
}
