// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

/**
 * Returns the number of currently open trades
 */
export function opentrades(context: any) {
    return () => {
        return context.strategy?.openTrades?.length || 0;
    };
}
