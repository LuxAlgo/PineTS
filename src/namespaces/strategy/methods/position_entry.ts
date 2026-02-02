// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

/**
 * Returns the current position entry (alias for position_size in some contexts)
 * Positive for long positions, negative for short positions, 0 for flat
 */
export function position_entry(context: any) {
    return () => {
        return context.strategy?.position?.size || 0;
    };
}
