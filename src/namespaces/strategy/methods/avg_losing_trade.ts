// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Average loss across losing closed trades, returned as a POSITIVE number
 * (Pine convention: average loss is unsigned). NaN when no losers yet.
 * Matches Pine's strategy.avg_losing_trade.
 */
export function avg_losing_trade(context: any) {
    return () => {
        const s = context.strategy;
        if (!s || s.losstrades === 0) return NaN;
        return s.losstrades_total_loss / s.losstrades;
    };
}
