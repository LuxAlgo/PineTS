// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Realized P&L summed across all closed trades.
 * Matches Pine's strategy.netprofit.
 */
export function netprofit(context: any) {
    return () => {
        return context.strategy?.netprofit ?? 0;
    };
}
