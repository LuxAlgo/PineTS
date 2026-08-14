// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Total currency value of all completed losing trades, as a POSITIVE number
 * (the absolute sum of losses). Matches Pine's strategy.grossloss semantics.
 */
export function grossloss(context: any) {
    return () => context.strategy?.grossloss ?? 0;
}
