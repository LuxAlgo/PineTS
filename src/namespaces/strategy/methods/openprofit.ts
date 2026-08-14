// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Unrealized P&L across all currently-open trades.
 * Matches Pine's strategy.openprofit. Updated each bar by updateUnrealizedPnL().
 */
export function openprofit(context: any) {
    return () => context.strategy?.openprofit ?? 0;
}
