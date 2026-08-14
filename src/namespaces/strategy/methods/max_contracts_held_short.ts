// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/** Peak |short-side position_size| seen. Matches Pine's strategy.max_contracts_held_short. */
export function max_contracts_held_short(context: any) {
    return () => context.strategy?.max_contracts_held_short ?? 0;
}
