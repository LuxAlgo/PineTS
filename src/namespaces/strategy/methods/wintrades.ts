// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/** Count of closed trades with profit > 0. Matches Pine's strategy.wintrades. */
export function wintrades(context: any) {
    return () => context.strategy?.wintrades ?? 0;
}
