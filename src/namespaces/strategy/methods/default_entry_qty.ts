// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { calculateOrderQty } from '../utils';

/**
 * Returns the qty that would be used for an entry at the given fill price,
 * given the strategy's `default_qty_type` and `default_qty_value`. Mirrors
 * `calculateOrderQty()` without a specified qty (always uses the default).
 *
 * Pine signature: strategy.default_entry_qty(fill_price) → series float
 */
export function default_entry_qty(context: any) {
    return (fillPrice: number) => {
        if (!context.strategy) return 0;
        // direction=1 (long) is arbitrary — calculateOrderQty's percent-of-equity
        // / cash branches don't depend on direction sign.
        return calculateOrderQty(context, undefined, 1, fillPrice);
    };
}
