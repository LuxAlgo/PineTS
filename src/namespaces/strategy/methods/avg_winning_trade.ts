// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Average profit across winning closed trades. NaN when no winners yet.
 * Matches Pine's strategy.avg_winning_trade.
 */
export function avg_winning_trade(context: any) {
    return () => {
        const s = context.strategy;
        if (!s || s.wintrades === 0) return NaN;
        return s.wintrades_total_profit / s.wintrades;
    };
}
