// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/** Count of closed trades with profit < 0. Matches Pine's strategy.losstrades. */
export function losstrades(context: any) {
    return () => context.strategy?.losstrades ?? 0;
}
