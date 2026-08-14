// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Maximum peak-to-trough equity drawdown over the whole run (currency).
 * Matches Pine's strategy.max_drawdown.
 */
export function max_drawdown(context: any) {
    return () => context.strategy?.max_drawdown ?? 0;
}
