// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * strategy.grossloss as a percent of initial capital.
 */
export function grossloss_percent(context: any) {
    return () => {
        const s = context.strategy;
        if (!s || !s.initial_capital) return 0;
        return (100 * s.grossloss) / s.initial_capital;
    };
}
