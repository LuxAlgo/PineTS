// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Maximum equity run-up over the whole run (currency).
 * Matches Pine's strategy.max_runup.
 */
export function max_runup(context: any) {
    return () => context.strategy?.max_runup ?? 0;
}
