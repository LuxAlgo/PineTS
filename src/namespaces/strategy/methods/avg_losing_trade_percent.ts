// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Average per-trade loss (as a SIGNED negative percent) across losing
 * closed trades. NaN when no losers yet.
 *
 * Note: `strategy.avg_losing_trade` (the dollar version) is reported as
 * a POSITIVE magnitude by Pine convention, but `_percent` is signed —
 * negative values, since they represent losses.
 */
export function avg_losing_trade_percent(context: any) {
    return () => {
        const s = context.strategy;
        if (!s || s.losstrades === 0) return NaN;
        let sum = 0;
        for (const t of s.closedtrades) {
            if ((t.profit ?? 0) < 0) {
                const notional = Math.abs(t.size) * t.entry_price;
                if (notional > 0) sum += (100 * (t.profit ?? 0)) / notional;
            }
        }
        return sum / s.losstrades;
    };
}
