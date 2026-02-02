// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

/**
 * Returns the total net profit (realized P&L)
 */
export function netprofit(context: any) {
    return () => {
        return context.strategy?.netProfit || 0;
    };
}
