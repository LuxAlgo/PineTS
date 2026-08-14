// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/** Peak |position_size| seen across the run. Matches Pine's strategy.max_contracts_held_all. */
export function max_contracts_held_all(context: any) {
    return () => context.strategy?.max_contracts_held_all ?? 0;
}
