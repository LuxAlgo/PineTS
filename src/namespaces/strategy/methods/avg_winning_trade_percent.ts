// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Average per-trade return (as a percent) across winning closed trades.
 * NaN when no winners yet. Matches Pine's strategy.avg_winning_trade_percent.
 */
export function avg_winning_trade_percent(context: any) {
    return () => {
        const s = context.strategy;
        if (!s || s.wintrades === 0) return NaN;
        let sum = 0;
        for (const t of s.closedtrades) {
            if ((t.profit ?? 0) > 0) {
                const notional = Math.abs(t.size) * t.entry_price;
                if (notional > 0) sum += (100 * (t.profit ?? 0)) / notional;
            }
        }
        return sum / s.wintrades;
    };
}
