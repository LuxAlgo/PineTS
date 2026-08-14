// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Id string of the entry that initially opened the current position.
 * Empty string when flat. Matches Pine's strategy.position_entry_name.
 */
export function position_entry_name(context: any) {
    return () => context.strategy?.position_entry_name ?? '';
}
