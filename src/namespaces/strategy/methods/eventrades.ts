// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/** Count of breakeven (profit === 0) closed trades. Matches Pine's strategy.eventrades. */
export function eventrades(context: any) {
    return () => context.strategy?.eventrades ?? 0;
}
