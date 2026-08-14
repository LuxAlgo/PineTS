// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * strategy.grossprofit as a percent of initial capital.
 */
export function grossprofit_percent(context: any) {
    return () => {
        const s = context.strategy;
        if (!s || !s.initial_capital) return 0;
        return (100 * s.grossprofit) / s.initial_capital;
    };
}
