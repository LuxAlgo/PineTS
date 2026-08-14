// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Realized net profit expressed as a percent of initial capital.
 * Matches Pine's strategy.netprofit_percent.
 */
export function netprofit_percent(context: any) {
    return () => {
        const s = context.strategy;
        if (!s || !s.initial_capital) return 0;
        return (100 * s.netprofit) / s.initial_capital;
    };
}
