// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/** Peak long-side position_size seen. Matches Pine's strategy.max_contracts_held_long. */
export function max_contracts_held_long(context: any) {
    return () => context.strategy?.max_contracts_held_long ?? 0;
}
