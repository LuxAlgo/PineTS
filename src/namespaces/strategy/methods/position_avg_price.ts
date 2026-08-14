// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Weighted-average entry price of the current open position.
 * Returns NaN when flat — matches Pine's strategy.position_avg_price semantics.
 */
export function position_avg_price(context: any) {
    return () => {
        const s = context.strategy;
        if (!s || s.position_size === 0) return NaN;
        return s.position_avg_price;
    };
}
