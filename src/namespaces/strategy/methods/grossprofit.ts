// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Total currency value of all completed winning trades (post-commission).
 * Matches Pine's strategy.grossprofit.
 */
export function grossprofit(context: any) {
    return () => context.strategy?.grossprofit ?? 0;
}
