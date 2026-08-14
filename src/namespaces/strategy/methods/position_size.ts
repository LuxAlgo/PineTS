// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Signed position size — positive for long, negative for short, 0 for flat.
 * Matches Pine's strategy.position_size.
 */
export function position_size(context: any) {
    return () => {
        return context.strategy?.position_size ?? 0;
    };
}
