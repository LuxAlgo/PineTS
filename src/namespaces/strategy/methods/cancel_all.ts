// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { Order } from '../types';

/**
 * Cancel all pending orders — entries AND exits, as on TradingView. A strategy that cancels and
 * re-places its stop ladder every bar must not keep a stale trailing leg alive next to the new one.
 * Pine signature: strategy.cancel_all() → void
 */
export function cancel_all(context: any) {
    return () => {
        if (!context.strategy) {
            throw new Error('strategy.cancel_all() called before strategy() declaration');
        }
        context.strategy.pending_orders = context.strategy.pending_orders.filter(
            (o: Order) => o.status !== 'pending',   // TradingView cancels every pending order, exit legs included
        );
    };
}
