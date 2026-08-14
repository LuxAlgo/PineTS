// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Returns the current equity (initial_capital + netprofit + openprofit).
 * Matches Pine's strategy.equity.
 */
export function equity(context: any) {
    return () => {
        return context.strategy?.equity ?? context.strategy?.config?.initial_capital ?? 10000;
    };
}
