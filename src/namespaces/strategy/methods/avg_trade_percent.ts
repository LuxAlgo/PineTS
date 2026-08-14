// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Average per-trade return as a percent. Computed as the mean of each
 * closed trade's individual profit_percent = profit / (entry_price * |size|) * 100.
 * NaN when no trades have closed. Matches Pine's strategy.avg_trade_percent.
 */
export function avg_trade_percent(context: any) {
    return () => {
        const s = context.strategy;
        if (!s || !s.closedtrades || s.closedtrades.length === 0) return NaN;
        let sum = 0;
        for (const t of s.closedtrades) {
            const notional = Math.abs(t.size) * t.entry_price;
            if (notional > 0) sum += (100 * (t.profit ?? 0)) / notional;
        }
        return sum / s.closedtrades.length;
    };
}
