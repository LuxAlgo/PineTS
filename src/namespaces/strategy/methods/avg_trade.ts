// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Average profit/loss across all closed trades (post-commission).
 * NaN when no trades have closed. Matches Pine's strategy.avg_trade.
 */
export function avg_trade(context: any) {
    return () => {
        const s = context.strategy;
        if (!s || !s.closedtrades || s.closedtrades.length === 0) return NaN;
        return s.netprofit / s.closedtrades.length;
    };
}
