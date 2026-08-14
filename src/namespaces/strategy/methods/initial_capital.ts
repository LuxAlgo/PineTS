// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/** The initial capital configured on the strategy() declaration. Matches Pine's strategy.initial_capital. */
export function initial_capital(context: any) {
    return () => context.strategy?.initial_capital ?? 0;
}
